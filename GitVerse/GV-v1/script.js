const form = document.querySelector("form");
const usernameInput = document.querySelector("#username");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    getUser(usernameInput.value);
    getRepos(usernameInput.value);
});

async function getUser(username) {

    const response = await fetch(
        `https://api.github.com/users/${username}`
    );

    if (!response.ok) {
        console.log("User not found.");
        return;
    }
    const data = await response.json();

    console.log(data);
}

async function getRepos(username) {
    const response = await fetch(
        `https://api.github.com/users/${username}/repos`
    );

    const repos = await response.json();
    repos.forEach((repo) => {
        console.log(repo.name);
    });
}
