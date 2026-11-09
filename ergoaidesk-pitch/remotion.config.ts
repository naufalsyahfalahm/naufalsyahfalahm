/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Use a locally installed Chromium when present (e.g. offline/cloud sandboxes where Remotion's own
// headless shell cannot be downloaded). Otherwise Remotion's default browser is used.
import { existsSync } from "node:fs";
const localChromium = process.env.REMOTION_BROWSER_EXECUTABLE ?? "/opt/pw-browsers/chromium";
if (existsSync(localChromium)) {
  Config.setBrowserExecutable(localChromium);
}
