#set current path to ..
# Set-Location -Path ..
#extract fw version from main.c using regex
$opensslpath = "C:\Progra~1\OpenSSL-Win64\bin\openssl.exe"
$fwversion = Select-String -Path src\version.h -Pattern 'FW_VERSION ' | Select-Object -ExpandProperty Line | Select-String -Pattern '\d[^"]*' -AllMatches | Select-Object -ExpandProperty Matches | Select-Object -ExpandProperty Value

# Extract INNER_VERSION for all branches
$innerversion = Select-String -Path src\version.h -Pattern 'INNER_VERSION ' | Select-Object -ExpandProperty Line | Select-String -Pattern '"[^"]*"' -AllMatches | Select-Object -ExpandProperty Matches | Select-Object -ExpandProperty Value | ForEach-Object { $_.Trim('"') }

#check git branch
$branch = git rev-parse --abbrev-ref HEAD

#print version info
Write-Host "FW_VERSION: $fwversion"
Write-Host "INNER_VERSION: $innerversion"
Write-Host "Branch: $branch"

#if branch is p500, get the keys for the p500 branch
if ($branch -eq "p500") {
    # Check if the version contains p500
    if ($innerversion -like "*p500*") {
        Write-Host "Branch is p500 and version contains p500, using p500 key"
        $keyfile = "Private\keys\p500_key.pem"
    } else {
        Write-Host "ERROR: Branch is p500 but version does not contain p500 (version: $innerversion)"
        exit 1
    }
} else {
    Write-Host "Using default key for branch: $branch"
    $keyfile = "Private\keys\tikrprivkey.pem"
}

#verify that the source firmware contains the expected version strings
Write-Host "Verifying source firmware contains version strings..."
$sourceFirmwarePath = '.pio\build\esp32dev\firmware.bin'

if (-not (Test-Path $sourceFirmwarePath)) {
    Write-Host "ERROR: Source firmware not found at: $sourceFirmwarePath"
    Write-Host "Please build the firmware first"
    exit 1
}

$fwVersionCheck = Select-String -Path $sourceFirmwarePath -Pattern $fwversion -Quiet
$innerVersionCheck = Select-String -Path $sourceFirmwarePath -Pattern $innerversion -Quiet

if (-not $fwVersionCheck) {
    Write-Host "ERROR: Source firmware does not contain FW_VERSION: $fwversion"
    exit 1
}

if (-not $innerVersionCheck) {
    Write-Host "ERROR: Source firmware does not contain INNER_VERSION: $innerversion"
    exit 1
}

Write-Host "Source firmware validation: OK (FW_VERSION: $fwversion, INNER_VERSION: $innerversion)"

#create folder for firmware
New-Item -Path firmware -Name "FW-$fwversion" -ItemType Directory -Force

$sourcename = "firmware\FW-$fwversion\FW-$fwversion.bin"
#remove everything from folder
Remove-Item -Path "firmware\FW-$fwversion\*" -Force

#copy firmware to folder
Copy-Item -Path $sourceFirmwarePath -Destination $sourcename -ErrorVariable err

#check if firmware is copied
if ($err) {
    #print to console "FW_COPY: FAIL\n"
    Write-Host "FW_COPY: KO"
    return
} else {
    #print to console "FW_COPY: OK\n"
    Write-Host "FW_COPY: OK"
}

#sign firmware by running openssl and get return value
write-host "Signing firmware..."
Write-Host "$opensslpath dgst -sign $keyfile -keyform PEM -sha256 -out $sourcename.signed -binary $sourcename"
$cmd = "$opensslpath dgst -sign $keyfile -keyform PEM -sha256 -out $sourcename.signature -binary $sourcename" + ';$?'
$ret = Invoke-Expression $cmd

#append the firmware to the signed firmware
# cmd /c copy /b $sourcename.signature+$sourcename $sourcename.signed 

# PSv<7 Get-Content -Encoding Byte  "$sourcename.signature",$sourcename | Set-Content -Encoding Byte "$sourcename.signed"
Get-Content -AsByteStream  "$sourcename.signature",$sourcename | Set-Content -AsByteStream  "$sourcename.signed"
Remove-Item -Path "$sourcename.signature" -Force

#check return value
if (-not $ret) {
    #print to console "FW_SIGN: OK\n"
    Write-Host "FW_SIGN: KO"
} else {
    #print to console "FW_SIGN: FAIL\n"
    Write-Host "FW_SIGN: OK"
}
exit 0
```
