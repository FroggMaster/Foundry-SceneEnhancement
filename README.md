## [For Developers, please read these instructions](#For-Developers)


## [DF Scene Enhancement](https://github.com/flamewave000/dragonflagon-fvtt/blob/master/df-scene-enhance/README.md)
![Forge Installs](https://img.shields.io/badge/dynamic/json?color=red&label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-scene-enhance) ![Latest Version](https://img.shields.io/badge/dynamic/json?label=Latest%20Release&prefix=v&query=package.versions%5B0%5D&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-scene-enhance) [![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdf-scene-enhance%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/df-scene-enhance/)  
A few enhancements to scene management for players and GMs.

---

# For Developers

If you wish to contribute to any modules, please perform the following to build any module in the project.

## Install NPM Packages

Within the root directory of the project, execute the following command

```bash
npm install
```

## Setup Foundry Environment

If you wish to use all of the commands `launch`, `devbuild` and `devwatch`, you will need to initialize the full Foundry Environment. This also requires you to have the Node version of Foundry installed. This only needs to be done once, or after you move the Server or Data directories.

```bash
npm run env /path/to/foundryvtt /path/to/foundrydata
```

 - `/path/to/foundryvtt`: This is the absolute path to your FoundryVTT installation directory
 - `/path/to/foundrydata`: This is the absolute path to your FoundryVTT Data directory

If you don't intend to use the `launch` command, then you can simply pass an empty string for the `foundryvtt` path.
```bash
npm run env "" /path/to/foundrydata
```

## Set Target Module

To perform builds, you must set the current module target. This is done by running the following command with the desired target module's name.

```bash
npm run target df-curvy-walls
```

## Commands

Once you have your environment and target module set up, you can use any of the following commands:

```bash
# General in-place build commands
npm run build    # Builds target module
npm run watch    # Watches files and builds target module
npm run clean    # Deletes target module build files

# Dev Environment build commands (requires data path to be set in .devenv)
npm run devbuild # Builds target module and outputs to Foundry module folder
npm run devwatch # Watches files and builds target module to Foundry module folder
npm run devclean # Deletes target module build files from the Foundry module folder

# Bundle/Release Commands
npm run stage    # Builds and bundles the target module without optimization
npm run prod     # Builds and bundles the target module with optimization
npm run tag      # Tags the current commit with the target module's name and version (ie. df_qol_1.0.0)

# Helpers
npm run launch   # Launches the Foundry Server (requires install path to be set in .devenv)
npm run release  # Executes `npm run lint && npm run tag && npm run prod`
```

