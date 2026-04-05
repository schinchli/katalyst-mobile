# credentials/

Place store-signing credentials here. All JSON/key files are gitignored.

## Required files

### `google-play-service-account.json`
Download from: Google Play Console → Setup → API access → Service accounts → Create/Download

The service account must have the **Release Manager** role in Play Console.

Steps:
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to Setup → API access
3. Link to a Google Cloud project (or create one)
4. Create a service account → Grant access → Release Manager role
5. Download the JSON key
6. Rename it to `google-play-service-account.json` and place it in this folder

### iOS certificates
EAS manages iOS certificates automatically. No files needed here for iOS.

## eas.json path
`eas.json` references this file as: `"./credentials/google-play-service-account.json"`
