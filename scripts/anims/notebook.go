package main

import (
	"flag"
	"image"
	"image/color"
	"image/gif"
	"log"
	"math/rand"
	"os"
)

// Segment represents a part of the ribbon with its own color and timing
type Segment struct {
	startX   int
	width    int
	color    color.RGBA
	duration int
	timeLeft int
}

func randomColor() color.RGBA {
	// Generate vibrant colors by ensuring at least one component is high
	colors := []color.RGBA{
		// Reds
		{255, 0, 0, 255},     // Pure Red
		{220, 20, 60, 255},   // Crimson
		{178, 34, 34, 255},   // Firebrick
		{255, 99, 71, 255},   // Tomato
		{250, 128, 114, 255}, // Salmon
		{205, 92, 92, 255},   // Indian Red

		// Oranges
		{255, 165, 0, 255},  // Orange
		{255, 140, 0, 255},  // Dark Orange
		{255, 127, 80, 255}, // Coral
		{255, 69, 0, 255},   // Orange Red
		{255, 99, 71, 255},  // Tomato

		// Yellows
		{255, 255, 0, 255},   // Yellow
		{255, 215, 0, 255},   // Gold
		{255, 223, 0, 255},   // Golden Rod
		{218, 165, 32, 255},  // Golden Rod
		{240, 230, 140, 255}, // Khaki

		// Greens
		{0, 255, 0, 255},     // Pure Green
		{50, 205, 50, 255},   // Lime Green
		{34, 139, 34, 255},   // Forest Green
		{0, 128, 0, 255},     // Green
		{124, 252, 0, 255},   // Lawn Green
		{173, 255, 47, 255},  // Green Yellow
		{0, 250, 154, 255},   // Medium Spring Green
		{32, 178, 170, 255},  // Light Sea Green
		{152, 251, 152, 255}, // Pale Green

		// Cyans/Teals
		{0, 255, 255, 255},  // Cyan
		{0, 206, 209, 255},  // Dark Turquoise
		{64, 224, 208, 255}, // Turquoise
		{72, 209, 204, 255}, // Medium Turquoise
		{0, 139, 139, 255},  // Dark Cyan

		// Blues
		{0, 0, 255, 255},     // Pure Blue
		{0, 191, 255, 255},   // Deep Sky Blue
		{30, 144, 255, 255},  // Dodger Blue
		{100, 149, 237, 255}, // Cornflower Blue
		{70, 130, 180, 255},  // Steel Blue
		{106, 90, 205, 255},  // Slate Blue
		{0, 0, 139, 255},     // Dark Blue
		{25, 25, 112, 255},   // Midnight Blue
		{65, 105, 225, 255},  // Royal Blue

		// Purples
		{128, 0, 128, 255},   // Purple
		{147, 112, 219, 255}, // Medium Purple
		{153, 50, 204, 255},  // Dark Orchid
		{138, 43, 226, 255},  // Blue Violet
		{148, 0, 211, 255},   // Dark Violet
		{186, 85, 211, 255},  // Medium Orchid
		{218, 112, 214, 255}, // Orchid
		{221, 160, 221, 255}, // Plum

		// Pinks
		{255, 192, 203, 255}, // Pink
		{255, 182, 193, 255}, // Light Pink
		{255, 105, 180, 255}, // Hot Pink
		{255, 20, 147, 255},  // Deep Pink
		{199, 21, 133, 255},  // Medium Violet Red
		{219, 112, 147, 255}, // Pale Violet Red

		// Browns/Golds
		{210, 105, 30, 255},  // Chocolate
		{184, 134, 11, 255},  // Dark Golden Rod
		{205, 133, 63, 255},  // Peru
		{244, 164, 96, 255},  // Sandy Brown
		{218, 165, 32, 255},  // Golden Rod
		{210, 180, 140, 255}, // Tan

		// Misc Vibrant Colors
		{255, 0, 255, 255},  // Magenta
		{255, 0, 127, 255},  // Deep Pink
		{148, 0, 211, 255},  // Dark Violet
		{138, 43, 226, 255}, // Blue Violet
		{75, 0, 130, 255},   // Indigo
		{106, 90, 205, 255}, // Slate Blue
		{0, 250, 154, 255},  // Medium Spring Green
		{0, 255, 127, 255},  // Spring Green
	}
	return colors[rand.Intn(len(colors))]
}

func main() {
	// Define command line flags
	seedPtr := flag.Int64("seed", 42, "random seed for the animation")
	outputPtr := flag.String("output", "notebook.gif", "output filename")
	flag.Parse()

	// Initialize random number generator with the provided seed
	rand.Seed(*seedPtr)

	width, height := 300, 400
	numFrames := 120

	goldenRatio := 1.618033988749895
	stripePosition := int(float64(height) * (1 / goldenRatio))

	// Initialize ribbon segments
	ribbonStart := width/8 + 1
	ribbonEnd := width - width/16
	ribbonWidth := ribbonEnd - ribbonStart

	// Create random segments
	minSegmentWidth := ribbonWidth / 20
	maxSegmentWidth := ribbonWidth / 5

	var segments []Segment
	currentX := ribbonStart
	for currentX < ribbonEnd {
		remainingWidth := ribbonEnd - currentX
		segmentWidth := rand.Intn(maxSegmentWidth-minSegmentWidth) + minSegmentWidth
		if segmentWidth > remainingWidth {
			segmentWidth = remainingWidth
		}

		duration := rand.Intn(16) + 5

		segments = append(segments, Segment{
			startX:   currentX,
			width:    segmentWidth,
			color:    randomColor(),
			duration: duration,
			timeLeft: duration,
		})
		currentX += segmentWidth
	}

	outFile, err := os.Create(*outputPtr)
	if err != nil {
		log.Fatalf("error creating output file: %v", err)
	}
	defer outFile.Close()

	anim := gif.GIF{
		LoopCount: 0, // 0 means loop forever
	}

	// Define base colors
	notebookBlack := color.RGBA{40, 40, 40, 255}

	for frame := 0; frame < numFrames; frame++ {
		// Update segments
		for i := range segments {
			segments[i].timeLeft--
			if segments[i].timeLeft <= 0 {
				segments[i].color = randomColor()
				segments[i].timeLeft = segments[i].duration
			}
		}

		// Create new palette for this frame
		palette := []color.Color{
			color.White,   // Background
			notebookBlack, // Notebook color
		}

		// Add segment colors to palette
		colorIndices := make([]int, len(segments))
		for i, seg := range segments {
			colorIndices[i] = len(palette)
			palette = append(palette, seg.color)
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

		// Draw ribbon segments
		ribbonHeight := height / 12
		for i, seg := range segments {
			for x := seg.startX; x < seg.startX+seg.width; x++ {
				for y := stripePosition - ribbonHeight/2; y < stripePosition+ribbonHeight/2; y++ {
					img.Set(x, y, palette[colorIndices[i]])
				}
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

		anim.Image = append(anim.Image, img)
		anim.Delay = append(anim.Delay, 5) // 50ms per frame
	}

	err = gif.EncodeAll(outFile, &anim)
	if err != nil {
		log.Fatalf("error encoding GIF: %v", err)
	}
}
