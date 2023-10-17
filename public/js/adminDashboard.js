let tabs = document.querySelectorAll(".btn");
let tabContents = document.querySelectorAll(".main-container");

tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        tabContents.forEach(content => {
            content.removeAttribute("id");
        });
        tabContents[index].setAttribute("id", "active");
    });
});