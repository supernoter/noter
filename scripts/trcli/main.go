package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/adlio/trello"
)

type ActivitySummary struct {
	NewCards   []CardActivity
	MovedCards []CardActivity
	ListCounts map[string]int
	TotalNew   int
	TotalMoved int
}

type CardActivity struct {
	CardName string
	ListName string
	Date     time.Time
}

func main() {
	// Get API credentials from environment variables
	apiKey := os.Getenv("TRELLO_API_KEY")
	token := os.Getenv("TRELLO_TOKEN")
	boardID := os.Getenv("TRELLO_BOARD_ID")

	if apiKey == "" || token == "" || boardID == "" {
		log.Fatal("Please set TRELLO_API_KEY, TRELLO_TOKEN, and TRELLO_BOARD_ID environment variables")
	}

	// Create a new Trello client
	client := trello.NewClient(apiKey, token)

	// Get the board
	board, err := client.GetBoard(boardID, trello.Defaults())
	if err != nil {
		log.Fatalf("Error getting board: %v", err)
	}

	// Print current board state
	printBoardState(board)

	// Print recent activity summary
	fmt.Printf("\nRecent Activity (Last 3 Days)\n")
	fmt.Println("-----------------------------")
	summary := getRecentActivity(board)
	printActivitySummary(summary)
}

func printBoardState(board *trello.Board) {
	// Get all lists on the board
	lists, err := board.GetLists(trello.Defaults())
	if err != nil {
		log.Fatalf("Error getting lists: %v", err)
	}

	// Print board name
	fmt.Printf("Board: %s\n", board.Name)
	fmt.Println(strings.Repeat("-", len(board.Name)+7))

	// Iterate through each list
	for _, list := range lists {
		fmt.Printf("\n📋 List: %s\n", list.Name)

		// Get cards in the list
		cards, err := list.GetCards(trello.Defaults())
		if err != nil {
			log.Printf("Error getting cards for list %s: %v", list.Name, err)
			continue
		}

		if len(cards) == 0 {
			fmt.Println("   (no cards)")
			continue
		}

		// Print each card with its members
		for _, card := range cards {
			fmt.Printf("   • %s\n", card.Name)

			members, err := card.GetMembers()
			if err != nil {
				continue
			}

			if len(members) > 0 {
				memberNames := make([]string, len(members))
				for i, member := range members {
					memberNames[i] = member.FullName
				}
				fmt.Printf("     👤 Assigned to: %s\n", strings.Join(memberNames, ", "))
			}
		}
	}
}

func getRecentActivity(board *trello.Board) ActivitySummary {
	summary := ActivitySummary{
		ListCounts: make(map[string]int),
	}

	// Get actions for the board
	actions, err := board.GetActions(trello.Arguments{"filter": "all", "limit": "1000"})
	if err != nil {
		log.Printf("Error getting board actions: %v", err)
		return summary
	}

	threeDaysAgo := time.Now().AddDate(0, 0, -3)

	for _, action := range actions {
		if action.Date.Before(threeDaysAgo) {
			continue
		}

		switch action.Type {
		case "createCard":
			cardName := action.Data.Card.Name
			listName := action.Data.List.Name

			summary.NewCards = append(summary.NewCards, CardActivity{
				CardName: cardName,
				ListName: listName,
				Date:     action.Date,
			})
			summary.ListCounts[listName]++
			summary.TotalNew++

		case "updateCard":
			// Check if the card was moved to a different list
			if action.Data.ListAfter != nil && action.Data.ListBefore != nil {
				cardName := action.Data.Card.Name
				listName := action.Data.ListAfter.Name

				summary.MovedCards = append(summary.MovedCards, CardActivity{
					CardName: cardName,
					ListName: listName,
					Date:     action.Date,
				})
				summary.TotalMoved++
			}
		}
	}

	return summary
}

func printActivitySummary(summary ActivitySummary) {
	fmt.Printf("🆕 New Cards Created: %d\n", summary.TotalNew)
	if summary.TotalNew > 0 {
		fmt.Println("\nNew cards by list:")
		for list, count := range summary.ListCounts {
			fmt.Printf("   • %s: %d cards\n", list, count)
		}

		fmt.Println("\nMost recent new cards:")
		for i, card := range summary.NewCards {
			if i >= 5 { // Show only the 5 most recent
				break
			}
			fmt.Printf("   • %s (in %s)\n", card.CardName, card.ListName)
		}
	}

	fmt.Printf("\n🔄 Cards Moved Between Lists: %d\n", summary.TotalMoved)
	if summary.TotalMoved > 0 {
		fmt.Println("\nMost recent moves:")
		for i, card := range summary.MovedCards {
			if i >= 5 { // Show only the 5 most recent
				break
			}
			fmt.Printf("   • %s → %s\n", card.CardName, card.ListName)
		}
	}

	if summary.TotalNew == 0 && summary.TotalMoved == 0 {
		fmt.Println("No activity in the last 3 days")
	}
}
