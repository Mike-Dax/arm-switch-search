# Requirements

Electric UI toolchain, yarn, node.

# To build

Arm 7l

```bash
npm_config_arch=arm npm_config_platform=linux ARM_VERSION=7 yarn install
arc run build -- -l --armv7l
```

Arm 8

```bash
npm_config_arch=arm64 npm_config_platform=linux ARM_VERSION=8 yarn install
arc run build -- -l --arm64
```

# To run

Generate a run with `yarn generate > run.txt`, execute each command in there in the directory of the released app to generate a folder with run data in it.

You can run an alternate URL with `ALTERNATE_URL="https://whatever"`