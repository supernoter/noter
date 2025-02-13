package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	cssURL        = flag.String("u", "", "URL of the remote CSS file")
	outputDir     = flag.String("d", "dist", "Directory to store downloaded assets")
	assetSubDir   = flag.String("a", "assets", "assets subdir")
	styleFilename = flag.String("f", "style.css", "Style filename to generate")
	userAgent     = flag.String("A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "User-Agent string to use for requests")
)

func main() {
	flag.Parse()
	if *cssURL == "" {
		log.Fatal("url to a remote css file required")
	}

	fullAssetDir := filepath.Join(*outputDir, *assetSubDir)
	if err := os.MkdirAll(fullAssetDir, 0755); err != nil {
		log.Fatal(err)
	}

	blob, err := downloadFile(*cssURL)
	if err != nil {
		log.Fatalf("css download failed: %v", err)
	}
	processedCSS, err := processCSS(string(blob), *assetSubDir, *cssURL)
	if err != nil {
		log.Fatal(err)
	}
	outPath := filepath.Join(*outputDir, *styleFilename)
	err = os.WriteFile(outPath, []byte(processedCSS), 0644)
	if err != nil {
		log.Fatal(err)
	}
}

func downloadFile(urlStr string) ([]byte, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return nil, err
	}
	// Set the specified User-Agent
	req.Header.Set("User-Agent", *userAgent)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// resolveURL takes a potentially relative URL and resolves it against a base URL
func resolveURL(base, relative string) (string, error) {
	baseURL, err := url.Parse(base)
	if err != nil {
		return "", err
	}
	relativeURL, err := url.Parse(relative)
	if err != nil {
		return "", err
	}
	return baseURL.ResolveReference(relativeURL).String(), nil
}

func processCSS(css, assetSubDir, baseURL string) (string, error) {
	var (
		urlPattern = regexp.MustCompile(`url\((.*?)\)`)
		matches    = urlPattern.FindAllStringSubmatch(css, -1)
	)
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		originalURL := strings.Trim(match[1], "'\" ")
		if strings.HasPrefix(originalURL, "data:") {
			continue
		}
		// Resolve the URL if it's relative
		fullURL, err := resolveURL(baseURL, originalURL)
		if err != nil {
			return "", fmt.Errorf("error resolving URL %s: %v", originalURL, err)
		}
		blob, err := downloadFile(fullURL)
		if err != nil {
			return "", fmt.Errorf("error downloading asset %s: %v", fullURL, err)
		}
		// Parse the URL to get its path components
		parsedURL, err := url.Parse(fullURL)
		if err != nil {
			return "", fmt.Errorf("error parsing URL %s: %v", fullURL, err)
		}
		// Get the path components after the hostname
		pathComponents := parsedURL.Path
		if pathComponents == "" {
			return "", fmt.Errorf("URL %s has no path component", fullURL)
		}
		// Remove leading slash if present
		pathComponents = strings.TrimPrefix(pathComponents, "/")
		// Create the local path by joining the asset subdirectory with the URL path
		localPath := filepath.Join(*outputDir, assetSubDir, pathComponents)
		// Ensure the asset directory exists
		if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
			return "", fmt.Errorf("error creating directory for %s: %v", localPath, err)
		}
		err = os.WriteFile(localPath, blob, 0644)
		if err != nil {
			return "", fmt.Errorf("error saving asset %s: %v", localPath, err)
		}
		css = strings.Replace(css, match[0], fmt.Sprintf("url(%s)", localPath), 1)
	}
	return css, nil
}
