Add-Type -AssemblyName System.Drawing

$src  = Join-Path $PSScriptRoot '..\resources\icon.png'
$ico  = Join-Path $PSScriptRoot '..\resources\icon.ico'
$tray = Join-Path $PSScriptRoot '..\resources\tray.ico'

# Load source image (JPEG or PNG) and resize to 256x256
$img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
$bmp = New-Object System.Drawing.Bitmap($img, 256, 256)

# Export as PNG bytes into memory
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()
$img.Dispose()

# Build ICO binary (PNG-in-ICO, valid on Windows Vista+)
$dataOffset = [uint32]22      # 6 (ICONDIR) + 16 (ICONDIRENTRY)
$buf = New-Object byte[] ($dataOffset + $pngBytes.Length)

# ICONDIR: reserved=0, type=1 (icon), count=1
$buf[0] = 0; $buf[1] = 0
$buf[2] = 1; $buf[3] = 0
$buf[4] = 1; $buf[5] = 0

# ICONDIRENTRY: width=0 (256), height=0 (256), colorCount=0, reserved=0
$buf[6]  = 0   # width  (0 = 256)
$buf[7]  = 0   # height (0 = 256)
$buf[8]  = 0   # color count
$buf[9]  = 0   # reserved
# planes = 1
$buf[10] = 1; $buf[11] = 0
# bit count = 32
$buf[12] = 32; $buf[13] = 0
# image data size (little-endian uint32)
$sizeBytes = [BitConverter]::GetBytes([uint32]$pngBytes.Length)
$buf[14] = $sizeBytes[0]; $buf[15] = $sizeBytes[1]
$buf[16] = $sizeBytes[2]; $buf[17] = $sizeBytes[3]
# image data offset (little-endian uint32)
$offBytes = [BitConverter]::GetBytes($dataOffset)
$buf[18] = $offBytes[0]; $buf[19] = $offBytes[1]
$buf[20] = $offBytes[2]; $buf[21] = $offBytes[3]

# Copy PNG data
[System.Buffer]::BlockCopy($pngBytes, 0, $buf, $dataOffset, $pngBytes.Length)

[System.IO.File]::WriteAllBytes($ico,  $buf)
[System.IO.File]::WriteAllBytes($tray, $buf)

Write-Host "icon.ico  generated ($($buf.Length) bytes)"
Write-Host "tray.ico  generated ($($buf.Length) bytes)"
