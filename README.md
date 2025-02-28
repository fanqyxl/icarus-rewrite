# ICARUS
An exploit for Chrome devices which allows people to unenroll devices with device management interception using a proxy and a custom Certificate Authority.
<br>
> WRITABLE HAS COMPLETELY ABANDONED THIS PROJECT, SO I WILL TRY TO TAKE OVER

> [!IMPORTANT]
> IT IS KNOWN THAT ICARUS IS CURRENTLY BROKEN SERVER SIDE. I WILL FIND A FIX SOON, HOST A SAFE PUBLIC IP, AND REMOVE THE LINES WHERE IT LOGS DEVICE SECRETS (insuring you dont get remotely compromised)
  

> [!IMPORTANT]
> DO NOT USE ANY PUBLIC IP ADDRESSES FOR ICARUS AS A PROXY, YOU WILL RISK YOUR DATA and YOU WILL BE REMOTELY COMPROMISED.<br><br>
> ANYTHING GOOGLE CAN REMOTELY PERFORM ON YOUR DEVICE, ICARUS CAN BE USED TO DO. AN EXAMPLE OF THIS IS INSTALL EXTENSIONS, SPY, USE YOUR CAMERA, REMOTE INTO YOUR DEVICE, GET YOUR PASSWORDS, AND MORE.<br><br>
> ONLY SELF HOST ICARUS, NEVER USE A PUBLIC SERVER!
> - WRITABLE

## New configs?
"New configs" have rolled keys. We are testing the compatibility of these new keys for interception.

## Setup and installation instructions
Clone the repo with ``git clone --recursive https://github.com/fanqyxl/icarus`` and change directory to it.

Set up the environment by running the following commands (Make sure you have python3, python3-venv, and protobuf installed beforehand):

- `make setup-venv`
- `make enter-venv`
- `make setup-python`
- `make build-packed-data`

Before continuing, open Chrome on your build machine and go to chrome://components. Press CTRL + F and search for "PKIMetadata". Once you find it, press "Check for Updates". Make sure it says up-to-date before continuing (and that the version is below 2000.)
  
- `bash get_original_data.sh`
- `bash make_out.sh myCA.der`

After doing this the output directory (from here on reffered to as PKIMetadata) will be generated, which is the custom Certificate Authority.

Now, to modify the shim with the generated PKIMetadata:

- `bash modify.sh <shim path>`

Now boot the shim, and ICARUS will attempt to modify your stateful partition.

### Server setup
Requirements: npm, node  
Run `make start-server` to start your proxy, then continue with the instructions below.

Do not use WSL to host a server!

## Setup and installation instructions, continued
Reboot the device. You'll boot into verified mode. Once you have your server running, open the network configuration by clicking the lower right button (it will show the date), connecting to wifi, and then change the proxy settings accordingly.

- Set proxy settings to manual
- Set HTTPS IP to the IP you used to host the proxy server. 
- Resume setup and your device will unenroll. 

## Using Prebuilts
Get a board specific prebuilt from:
- [Archimax's Host (not uploaded yet)](https://dl.archima.xyz/)
- [Darkn's Host](https://dl.darkn.bio)
- [Fanqyxl's Host](https://dl.fanqyxl.net)
- [Kxtz's Host](https://dl.kxtz.dev)

Flash it using [CRU](https://chromewebstore.google.com/detail/chromebook-recovery-utili/pocpnlppkickgojjlmhdmidojbmbodfm?hl=en), [Rufus](https://rufus.ie), or [Balena Etcher](https://etcher.balena.io/) onto your USB.

Get your chromebook and boot the shim:
- Esc + Refresh + Power
- Control + D
- Enter Dev Mode (regardless of whether its blocked or not)
- Esc + Refresh + Power again and plug in the USB

Follow the instructions to create a server.

## Post Unenroll
Many people have been getting re-enrolled after a reboot or powerwash. Until https://github.com/MunyDev/icarus/pull/15 gets merged here is what you should do if you want to enable dev mode or powerwash.
- Build yourself a shim or get yourself a prebuilt from
- [Archimax's Host (not uploaded yet)](https://dl.archima.xyz/)
- [Darkn's Host](https://dl.darkn.bio)
- [Fanqyxl's Host](https://dl.fanqyxl.net)
- [Kxtz's Host](https://dl.kxtz.dev)
- Flash it onto your USB.
- Boot into sh1mmer and click "deprovision device"
- Reboot your chromebook and enable dev mode.
- Downgrade to v123 or lower
- Once in the OOBE enter VT2 by Clicking Ctrl + Alt + --->
- Run `tpm_manager_client take_ownership`
- And `cryptohome --action=remove_firmware_management_parameters`
- Now you can continue setting up your chromebook normally.
## Troubleshooting

<details>
  <summary>During building, everything starting from root was copied into original!</summary>

  Please run ``git pull`` on your local copy. This bug has been fixed.
</details>

<details>
  <summary>My device says "Can't reach Google"!</summary>
  
  - Make sure your device and the server are connected to the same network
  - If that didn't work, powerwash your device and re-run the modified shim, and keep the server running.
</details>

## Credits
- [MunyDev](https://github.com/MunyDev) - Creating this exploit
- [Archimax](https://github.com/EnterTheVoid-x86) - Cleaning up get_original_data.sh and inshim.sh + README changes
- [r58Playz](https://github.com/r58Playz) - General bash script improvements
- [Akane](https://github.com/genericness) - Help with SSL, general advice, and README changes
