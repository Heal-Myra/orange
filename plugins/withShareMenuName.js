// The share menu shows the share extension's name. expo-share-intent uses one setting for both that name and the
// Xcode target's name, and "Happy Orange" would clash with the app's own target ("HappyOrange"). So the target is
// "HappyOrangeShare" and this small plugin (listed BEFORE expo-share-intent in app.json, so it runs after it) sets the name people see in the share menu back to "Happy Orange".
const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withShareMenuName(config, { target = 'HappyOrangeShare', name = 'Happy Orange' } = {}) {
  return withXcodeProject(config, async cfg => {
    const file = path.join(cfg.modRequest.platformProjectRoot, target, 'ShareExtension-Info.plist');
    if (fs.existsSync(file)) {
      const xml = fs.readFileSync(file, 'utf8')
        .replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${name}$2`);
      fs.writeFileSync(file, xml);
    }
    return cfg;
  });
};
