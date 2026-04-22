Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('D:\Onyx\apps\desktop\resources\icon.png')
Write-Host "Width: $($img.Width)  Height: $($img.Height)"
$img.Dispose()
