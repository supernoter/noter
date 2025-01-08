package main

import (
	"image"
	"image/color"
	"image/gif"
	"log"
	"math"
	"math/rand"
	"os"
	"time"
)

func main() {
	// Set up the image dimensions to match typical notebook proportions
	width, height := 300, 400
	numFrames := 24 // Increased for smoother breathing animation

	// Golden ratio ≈ 1.618033988749895
	goldenRatio := 1.618033988749895

	// Calculate stripe position using inverse golden ratio (1/φ ≈ 0.618034)
	// This positions the stripe at the more pleasing lower position
	stripePosition := int(float64(height) * (1 - 1/goldenRatio))

	// Create the output file
	outFile, err := os.Create("notebook.gif")
	if err != nil {
		panic(err)
	}
	defer outFile.Close()

	// Initialize the GIF
	anim := gif.GIF{}

	// Define colors
	notebookBlack := color.RGBA{40, 40, 40, 255} // Slightly softer than pure black
	ribbonColors := []color.Color{
		color.RGBA{255, 193, 7, 255},  // Golden yellow
		color.RGBA{233, 30, 99, 255},  // Pink
		color.RGBA{156, 39, 176, 255}, // Purple
		color.RGBA{33, 150, 243, 255}, // Blue
		color.RGBA{76, 175, 80, 255},  // Green
		color.RGBA{255, 87, 34, 255},  // Deep Orange
		color.RGBA{0, 188, 212, 255},  // Cyan
		color.RGBA{255, 152, 0, 255},  // Orange
	}

	// Seed the random number generator
	rand.Seed(time.Now().UnixNano())

	// Generate frames
	for i := 0; i < numFrames; i++ {
		// Create a palette for this frame
		palette := []color.Color{
			color.White,                       // Background (index 0)
			notebookBlack,                     // Notebook color (index 1)
			ribbonColors[i%len(ribbonColors)], // Ribbon color (index 2)
		}

		// Create a new image with the palette
		img := image.NewPaletted(image.Rect(0, 0, width, height), palette)

		// Fill the background
		for x := 0; x < width; x++ {
			for y := 0; y < height; y++ {
				// Draw the main notebook body in black
				if x > width/8 && x < width-width/16 {
					img.Set(x, y, palette[1])
				}
			}
		}

		// Draw the ribbon
		ribbonHeight := height / 12
		for x := width/8 + 1; x < width-width/16; x++ {
			for y := stripePosition - ribbonHeight/2; y < stripePosition+ribbonHeight/2; y++ {
				img.Set(x, y, palette[2])
			}
		}

		// Draw the elastic band (vertical line closer to center)
		bandX := width - width/6 // Moved more towards center
		bandWidth := width / 40  // Made thicker
		for x := bandX; x < bandX+bandWidth; x++ {
			for y := 0; y < height; y++ {
				img.Set(x, y, palette[1])
			}
		}

		// Calculate breathing-like delay using sine wave
		// Normal breathing rate is about 12-20 breaths per minute
		// We'll aim for around 15 breaths per minute = 4 seconds per cycle
		breatheCycle := math.Sin(2 * math.Pi * float64(i) / float64(numFrames))

		// Convert the sine wave to a delay between 20 and 80 centiseconds
		// This gives us a range of 0.2 to 0.8 seconds per frame
		delay := int(50 + 30*breatheCycle)

		// Append the frame to the GIF
		anim.Image = append(anim.Image, img)
		anim.Delay = append(anim.Delay, delay)
	}

	// Encode and save the GIF
	err = gif.EncodeAll(outFile, &anim)
	if err != nil {
		log.Fatal(err)
	}
}
