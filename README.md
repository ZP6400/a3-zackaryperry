## Black Hole Boogie - CS4241 A3

Zackary Perry
https://a3-zackaryperry.onrender.com/

This project contains a small game titled Black Hole Boogie, in which the user needs to press one of four keys as fast as they can before a ball gets sucked up by the black holes surrounding it. Building upon the features included in Assignment 2, a new difficulty "Daredevil" was implemented. This difficulty has the ball start off moving much faster and accelerating quicker as the player gains points, making for a more brief and challenging experience. A notes feature was also added, so that players can write down personal remarks or strategies in regard to a specific run they had.

Personal profiles have also been added to the game, implemented using MongoDB. Now, instead of having a serverwide leaderboard, players only see their own scores after signing in. Users can create an account and sign in simply by providing a username and password, or they can sign in via Open Authorization, specifically with GitHub. Integrating OAuth authentication with Passport.js was by far the most challenging aspect of this assignment (granted, it is an achievement and not part of the base assignment). Because of this, in the event it causes errors in the future, the local credential sign in feature remains included as a fallback option.

The CSS framework used for this assignment in particular was Bootstrap 5. The use of this framework did require all the CSS that was used in the previous implementation of this project in Assignment 2 to be scrapped, with the exception of the game space CSS. Despite this, Bootstrap 5 did prove to be a convenient framework to work with. The only exception to this was that some of its text and button classes that were used for this project needed to be tuned in order to pass the Accessibility test on Google Lighthouse with a 100% score, while maintaining the same overall style and appearance that Black Hole Boogie had for Assignment 2.

## Technical Achievements
- **Tech Achievement 1 (10 POINTS)**: As mentioned above, I used OAuth authentication via the GitHub strategy. The passport and passport-github2 libraries were used in particular, and the username/password login was still kept as a backup option in the event of any errors (or in the simple case that a player wouldn't want to sign in with GitHub). Apart from all the challenges that went with setting up OAuth authentication on its own, it was also challenging making sure that the project was able to differentiate between users signing in via GitHub or through standard means. 

- **Tech Achievement 2 (5 POINTS)**: I got 100% in all four lighthouse tests required for this assignment, with the specific categories being Performance, Accessibility, Best Practices, and SEO. Upon an initial test, the only two fields that required improvement were Accessibility and SEO. To address the SEO concerns, a `<meta>` tag was added to the HTML head in order to improve search engine results. Addressing the Accessibility concerns was done by tuning the text and button classes from Bootstrap 5 that were being used, as mentioned above. The heading structure also had to be fixed (using `<h2>` instead of `<h4>` in certain sections). Bootstrap classes were used to make sure the text itself still looked appealing.

- **Tech Achievement 3 (5 POINTS)**: I used the following five Express middleware packages for this assignment:
    1. *express-session*: This package saves user sessions via cookies, making it so the app remembers who is signed in at all times.
    2. *helmet*: This package automatically sets HTTP security headers on each response it makes to protect the site from any potential web attacks.
    3. *compression*: This package compresses files and API data before it then sends them to the browser, making for faster page load times.
    4. *morgan*: This package prints details about every incoming network request, printing them to the server terminal to help with debugging.
    5. *cors*: This package manages Cross-Origin Resource Sharing (CORS) rules in order to control which outside websites and domains are allowed to talk to the server's API endpoints.

### Design/Evaluation Achievements
- **Design Achievement 1**: N/A, I did not implement this achievement for this project

- **Design Achievement 2**: N/A, I did not implement this achievement for this project