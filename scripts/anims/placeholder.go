package main

import (
	"image"
	"image/color"
	"image/gif"
	"log"
	"math"
	"os"
)

func main() {
	width, height := 300, 400
	numFrames := 36 // Increased for smoother sequential animation

	goldenRatio := 1.618033988749895
	stripePosition := int(float64(height) * (1 / goldenRatio))

	// Animation squares parameters
	squareSize := width / 30
	squareSpacing := squareSize * 2
	squareY := stripePosition - squareSize*3
	squaresStartX := (width / 2) - (3*squareSize+2*squareSpacing)/2

	outFile, err := os.Create("notebook.gif")
	if err != nil {
		panic(err)
	}
	defer outFile.Close()

	anim := gif.GIF{}

	// Define colors
	notebookBlack := color.RGBA{40, 40, 40, 255}
	ribbonYellow := color.RGBA{255, 193, 7, 255}

	for i := 0; i < numFrames; i++ {
		palette := []color.Color{
			color.White,   // Background (index 0)
			notebookBlack, // Notebook color (index 1)
			ribbonYellow,  // Ribbon color (index 2)
		}

		img := image.NewPaletted(image.Rect(0, 0, width, height), palette)

		// Draw notebook body
		for x := 0; x < width; x++ {
			for y := 0; y < height; y++ {
				if x > width/8 && x < width-width/16 {
					img.Set(x, y, palette[1])
				}
			}
		}

		// Draw static ribbon
		ribbonHeight := height / 12
		for x := width/8 + 1; x < width-width/16; x++ {
			for y := stripePosition - ribbonHeight/2; y < stripePosition+ribbonHeight/2; y++ {
				img.Set(x, y, palette[2])
			}
		}

		// Draw elastic band
		bandX := width - width/6
		bandWidth := width / 40
		for x := bandX; x < bandX+bandWidth; x++ {
			for y := 0; y < height; y++ {
				img.Set(x, y, palette[1])
			}
		}

		// Draw animated squares with sequential animation
		for sq := 0; sq < 3; sq++ {
			// Calculate sequential timing
			// Each square takes 1/3 of the total animation cycle
			cycleLength := float64(numFrames) / 3
			squarePhase := float64(i) - (float64(sq) * cycleLength)

			// Normalize phase to 0-1 range for current square's cycle
			normalizedPhase := squarePhase / cycleLength

			// Calculate brightness factor using sine wave
			// Only animate when in this square's phase
			var factor float64
			if normalizedPhase >= 0 && normalizedPhase <= 1 {
				factor = math.Sin(normalizedPhase * math.Pi)
			} else {
				factor = 0
			}

			// Create interpolated color
			r := uint8(float64(ribbonYellow.R) * factor)
			g := uint8(float64(ribbonYellow.G) * factor)
			b := uint8(float64(ribbonYellow.B) * factor)
			squareColor := color.RGBA{r, g, b, 255}

			// Add the interpolated color to the palette
			paletteIndex := len(palette)
			img.Palette = append(img.Palette, squareColor)

			// Draw the square
			squareX := squaresStartX + sq*(squareSize+squareSpacing)
			for x := squareX; x < squareX+squareSize; x++ {
				for y := squareY; y < squareY+squareSize; y++ {
					img.Set(x, y, img.Palette[paletteIndex])
				}
			}
		}

		anim.Image = append(anim.Image, img)
		anim.Delay = append(anim.Delay, 4) // About 40ms per frame
	}

	err = gif.EncodeAll(outFile, &anim)
	if err != nil {
		log.Fatal(err)
	}
}
