This project is designed to help users create collection JSON files of their Magic: the Gathering card collections.

Current stable version: v1.4.12

**HOW TO USE:**
Please see in the app at the bottom (in the footer). Click the "Need help?" link to learn more about the platform.

**Scryfl Syntax**
The global card search in the header uses Scryfall to index cards and also uses the powerful Scryfa Syntax (search commands).
Search terms can be paired with search commands to enhance your search!
Let's say you're looking for a specific dragon card from the new Tarkir Dragonstorm set, "Ugin, Eye of the Storms".
Searching only "dragon" would produce too many results to filter, as would searching "Ugin".
refine your search by adding the `in:` keyword to the end of our query to tell the system we're looking for "ugin" *in* the Tarkir Dragonstorm set (TDM). Your search should look like this: "Ugin in:tdm" without the quotes.
Search is not case sensitive, and looks at your query while ignoring whitespaces.
Similarly, you could use "c:" to specify what mana color you are looking for. Example: "c:w" looks up all white mana cards. you can search multiple colors, like "c:ubg" will look for cards woth blue {u} black {b} and green {g} mana, which are Sultai colors. You could also search "c:sultai" for the same results.

**ROADMAP:**
1. Create collection feature - done
2. Enable colelction detail modification - done
3. Enable card search, preview and add/remove functionality - done
4. Enable quick card search from nav bar - done
5. Add sorting and filter features - done
6. Enable deck creation from current collection of cards - done
7. Refine experience and design for mobile and desktop - quality of life enhancements
8. Integrate working Google Picker API for cloud-based storage and retrieval
9. Migrate to managed server with secure user logging and file storage ***MAJOR UPDATE: v2.0.0***
10. Add share feature to share current JSON file to friends

Thanks for checking this out!
