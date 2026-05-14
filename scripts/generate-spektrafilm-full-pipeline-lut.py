#!/usr/bin/env python3
"""Generate the native Spektrafilm full-pipeline color LUT.

This bakes the deterministic Kodak Gold 200 -> Kodak Portra Endura
film/print/scanner pipeline from the upstream Spektrafilm Python runtime into
the app's 32x32x32 RGB LUT format. Spatial/stochastic effects are intentionally
disabled here; native Metal handles grain/glare during save.
"""

from pathlib import Path
import sys

import numpy as np


REPO_ROOT = Path(__file__).resolve().parents[1]
SPEKTRAFILM_ROOT = Path("/Users/konradparada/Documents/Codex/Spektrafilm")
DIMENSION = 32
OUTPUT = REPO_ROOT / "web/spektrafilm/luts/kodak_gold_200_portra_endura_full_pipeline_32.rgb"

sys.path.insert(0, str(SPEKTRAFILM_ROOT / "src"))

from spektrafilm.runtime.params_builder import digest_params, init_params  # noqa: E402
from spektrafilm.runtime.process import Simulator  # noqa: E402


def main() -> None:
    params = init_params(film_profile="kodak_gold_200", print_profile="kodak_portra_endura")
    params.camera.auto_exposure = False
    params.io.input_color_space = "sRGB"
    params.io.input_cctf_decoding = True
    params.io.output_color_space = "sRGB"
    params.io.output_cctf_encoding = True
    params.settings.use_fast_stats = True
    params.debug.deactivate_spatial_effects = True
    params.debug.deactivate_stochastic_effects = True
    params = digest_params(params)

    rgb = np.zeros((DIMENSION, DIMENSION * DIMENSION, 3), dtype=np.float64)
    for blue in range(DIMENSION):
        for green in range(DIMENSION):
            for red in range(DIMENSION):
                x = blue * DIMENSION + red
                rgb[green, x, :] = (
                    red / (DIMENSION - 1),
                    green / (DIMENSION - 1),
                    blue / (DIMENSION - 1),
                )

    simulator = Simulator(params)
    output = simulator.process(rgb)
    output = np.nan_to_num(output, nan=0.0, posinf=1.0, neginf=0.0)
    output = np.clip(output, 0.0, 1.0)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(np.rint(output * 255.0).astype(np.uint8).tobytes())
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(simulator.format_timings())


if __name__ == "__main__":
    main()
