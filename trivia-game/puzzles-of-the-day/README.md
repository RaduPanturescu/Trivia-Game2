# Puzzle of the Day image pool

Put the daily puzzle image files in this folder, then add each filename to `puzzles.json` under the `puzzles` array. The game shuffles the complete list once, serves one picture per calendar day, and does not repeat a picture until every listed picture has appeared.

Example manifest:

```json
{
  "puzzles": [
    "lake.jpg",
    "maya.png",
    { "src": "mountains.webp", "title": "Mountain View" }
  ]
}
```

The browser app cannot automatically enumerate files in a folder, so every image must be listed in the manifest. Run the game from a local web server (for example, VS Code Live Server) so the manifest can be fetched. Supported formats depend on the browser; JPG, PNG, and WebP are recommended.
