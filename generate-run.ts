type Switches = [command: string, options?: string[]]

// Generate all subsets of the given array
function* powerSet<T>(list: T[]): Generator<T[], void, unknown> {
    const length = list.length;
    const numberOfCombinations = Math.pow(2, length);
    for (let i = 0; i < numberOfCombinations; i++) {
        let subset: T[] = [];
        for (let j = 0; j < length; j++) {
            if ((i & Math.pow(2, j))) {
                subset.push(list[j]);
            }
        }
        yield subset;
    }
}

// Generate all permutations of switch options for the given subset
function* generatePermutations(switchesSubset: Switches[]) {
    const indexes = new Array(switchesSubset.length).fill(0);
    while (true) {
        yield switchesSubset.map((sw, i) => [sw[0], sw[1] && sw[1][indexes[i]] ? sw[1][indexes[i]] : undefined]);
        let k;
        for (k = 0; k < switchesSubset.length; k++) {
            if (switchesSubset[k][1] && indexes[k] + 1 < switchesSubset[k][1]!.length) {
                indexes[k]++;
                break;
            } else if (switchesSubset[k][1]) {
                indexes[k] = 0;
            }
        }
        if (k === switchesSubset.length) break;
    }
}

let options: Switches[] = [
    ['use-gl', ['desktop', 'swiftshader', 'egl']],
    ['no-sandbox'],
    ['ignore-gpu-blacklist'],
    ['ignore-gpu-blocklist'],
    ['disable-gpu-rasterization'],
    ['enable-native-gpu-memory-buffers'],
    ['enable-zero-copy'],
    ['gpu-sandbox-start-early'],
    // ['disable-accelerated-2d-canvas'],
    // ['force-gpu-rasterization'],
    // ['enable-gpu-rasterization'],
    // ['enable-gpu-compositing'],
    // ['enable-oop-rasterization'],
    // ['canvas-oop-rasterization'],
    // ['enable-raw-draw'],
    // ['disable-oop-rasterization'],
    // ['enable-one-copy-rasterizer'],
    // ['enable-checker-imaging'],
    // ['disable-gpu-compositing'],
    // ['enable-accelerated-video-decode'],
    // ['num-raster-threads', '4'],
];

// TODO: features?
// --enable-features=VaapiVideoDecoder

let runId = 1

for (const subset of powerSet(options)) {
  for (const args of generatePermutations(subset)) {

    // Remove nulls from the inner arrays
    const list = args.map(outer => outer.filter(inner => inner))

    console.log(`RUN_ID=${runId++} SET_SWITCHES='${JSON.stringify(list)}' ./perf-test`)
  }
}