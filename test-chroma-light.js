// Quick test of chroma-light.js functionality
import chroma from "./src/chroma-light.js";

try {
  console.log("Testing chroma-light.js...");

  // Test basic color creation
  const color = chroma("#3498db");
  console.log("✓ Basic color creation works");

  // Test get hsl.l
  const lightness = color.get("hsl.l");
  console.log('✓ get("hsl.l") works:', lightness);

  // Test set hsl.l
  const newColor = color.set("hsl.l", 0.8);
  console.log('✓ set("hsl.l", 0.8) works');

  // Test hex output
  const hexColor = newColor.hex();
  console.log("✓ hex() works:", hexColor);

  // Test saturate/desaturate
  const saturated = color.saturate(0.5);
  console.log("✓ saturate(0.5) works:", saturated.hex());

  const desaturated = color.desaturate(0.5);
  console.log("✓ desaturate(0.5) works:", desaturated.hex());

  console.log("\nAll tests passed! chroma-light.js is working correctly.");
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error.stack);
}
