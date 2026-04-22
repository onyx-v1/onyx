##
## generate-icons.ps1
## Auto-crops the logo from a non-square PNG, then builds a proper multi-size ICO.
##

Add-Type -AssemblyName System.Drawing

$src  = Resolve-Path (Join-Path $PSScriptRoot '..\resources\icon.png')
$ico  = Join-Path $PSScriptRoot '..\resources\icon.ico'
$tray = Join-Path $PSScriptRoot '..\resources\tray.ico'

Write-Host "Source: $src"

$srcImg = [System.Drawing.Image]::FromFile([string]$src)
Write-Host "Original size: $($srcImg.Width) x $($srcImg.Height)"

# ── Step 1: Smart crop — find the tightest bounding box around non-white pixels ──
$bmpSrc = New-Object System.Drawing.Bitmap($srcImg)
$minX = $bmpSrc.Width; $minY = $bmpSrc.Height; $maxX = 0; $maxY = 0

for ($y = 0; $y -lt $bmpSrc.Height; $y++) {
    for ($x = 0; $x -lt $bmpSrc.Width; $x++) {
        $pixel = $bmpSrc.GetPixel($x, $y)
        # Consider non-white / non-transparent pixels as "logo"
        $isBackground = ($pixel.A -lt 10) -or ($pixel.R -gt 245 -and $pixel.G -gt 245 -and $pixel.B -gt 245)
        if (-not $isBackground) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo bounds: ($minX, $minY) → ($maxX, $maxY)"

# Add a small padding (5% of the logo size on each side)
$logoW   = $maxX - $minX
$logoH   = $maxY - $minY
$pad     = [int]([Math]::Max($logoW, $logoH) * 0.06)
$cropX   = [Math]::Max(0, $minX - $pad)
$cropY   = [Math]::Max(0, $minY - $pad)
$cropW   = [Math]::Min($bmpSrc.Width  - $cropX, $logoW + $pad * 2)
$cropH   = [Math]::Min($bmpSrc.Height - $cropY, $logoH + $pad * 2)

# Make the crop square (take the larger side)
$squareSide = [Math]::Max($cropW, $cropH)
# Center the square crop
$cropX = [Math]::Max(0, $minX - [int](($squareSide - $logoW) / 2))
$cropY = [Math]::Max(0, $minY - [int](($squareSide - $logoH) / 2))

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $squareSide, $squareSide)
Write-Host "Crop rect: $cropX, $cropY  ${squareSide}x${squareSide}"

# Crop to square logo
$cropped = $bmpSrc.Clone($cropRect, $bmpSrc.PixelFormat)
$bmpSrc.Dispose()
$srcImg.Dispose()

# ── Step 2: Render each ICO size with high-quality resampling ──────────────────
$sizes     = @(256, 128, 64, 48, 32, 16)
$pngChunks = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($cropped, 0, 0, $size, $size)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngChunks += , $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
    Write-Host "  Rendered ${size}x${size}"
}
$cropped.Dispose()

# ── Step 3: Build multi-size ICO binary ───────────────────────────────────────
$count      = $sizes.Count
$dataOffset = 6 + (16 * $count)
$totalSize  = $dataOffset
foreach ($c in $pngChunks) { $totalSize += $c.Length }

$buf = New-Object byte[] $totalSize
$pos = 0

# ICONDIR header
$buf[$pos]=0; $buf[$pos+1]=0; $buf[$pos+2]=1; $buf[$pos+3]=0
$buf[$pos+4]=[byte]$count; $buf[$pos+5]=0
$pos += 6

# ICONDIRENTRY per image
$imgOffset = $dataOffset
for ($i = 0; $i -lt $count; $i++) {
    $sz    = $sizes[$i]
    $chunk = $pngChunks[$i]
    $icoSz = if ($sz -ge 256) { 0 } else { $sz }

    $buf[$pos]=$icoSz; $buf[$pos+1]=$icoSz
    $buf[$pos+2]=0; $buf[$pos+3]=0
    $buf[$pos+4]=1; $buf[$pos+5]=0
    $buf[$pos+6]=32; $buf[$pos+7]=0
    [Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]$chunk.Length), 0, $buf, $pos+8,  4)
    [Buffer]::BlockCopy([BitConverter]::GetBytes([uint32]$imgOffset),   0, $buf, $pos+12, 4)
    $pos       += 16
    $imgOffset += $chunk.Length
}

# PNG data
foreach ($c in $pngChunks) {
    [Buffer]::BlockCopy($c, 0, $buf, $pos, $c.Length)
    $pos += $c.Length
}

[System.IO.File]::WriteAllBytes($ico,  $buf)
[System.IO.File]::WriteAllBytes($tray, $buf)

Write-Host ""
Write-Host "icon.ico  -> $ico  ($totalSize bytes, $count sizes)"
Write-Host "tray.ico  -> $tray ($totalSize bytes, $count sizes)"
Write-Host "Done!"
