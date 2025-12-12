# Secure firmware upgrade

## Principles of firmware OTA upgrade

1. The device receives a JSON message on `FIRMWAREUPDATE/[macaddress]` (or `FIRMWAREUPDATE`) containing a URL
2. The device downloads the signature+firmware on the URL and writes it to the unused OTA partition
3. The device checks the signature of the written OTA partition
4. If the signature is valid, it mark the partition as bootable and restarts.

## A word of advice

In the context of firmware security, a private key is used to sign firmware images, which allows devices to verify that the firmware is authentic and has not been tampered with. If an attacker gains access to the private key, they can use it to create and sign their own malicious firmware images, which can be distributed to devices and cause a variety of security issues.

Therefore, it is extremely important to keep the private key used to sign firmware images secret and secure. This typically involves storing the key on a dedicated device, preferably offline.

## Generating the key material ON A SECURE COMPUTER

*This generation uses Openssl. It can be downloaded [here](https://slproweb.com/products/Win32OpenSSL.html).*

1. Open a console and go to the `bin` folder of `openssl`
2. Generate the key pair:

```bash
openssl genrsa -out priv_key.pem 4096
openssl rsa -in priv_key.pem -pubout > rsa_key.pub
```

3. Put the content of rsa_key.pub inside the `src/secret.h` file, variable `sigPub`

## Signing a new firmware

Once the firmware pushed expects signatures, every new firmware must be signed. 

1. Compile the code and get the binary firmware `.pio\build\esp32dev\firmware.bin`
2. Copy the firmware in the Secure computer...
3. Sign the firmware and put signature and fw inside one file:

```bash
# Create signature file
openssl dgst -sign priv_key.pem -keyform PEM -sha256 -out firmware.sign -binary firmware.bin

# throw it all in one file
cat firmware.sign firmware.bin > firmware.img
```

4. The file `firmware.img` is ready to be stored in the deployment server.