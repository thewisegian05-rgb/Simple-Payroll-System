// js/nav-scroll.js
//
// Makes the top nav stick as the page scrolls. Past SCROLL_THRESHOLD,
// the nav switches to a compact state: the center calculator links and
// the "Upload Excel" button collapse, while the logo, a compact search
// field, and the "Calculator" button stay visible.
//
// The compact search field mirrors the main "#search-employee" input
// so typing in either one filters the table (payroll.js already
// listens for "input" events on #search-employee).

(function () {

    const SCROLL_THRESHOLD = 40;

    const nav = document.getElementById("site-nav");
    const mainSearch = document.getElementById("search-employee");
    const navSearch = document.getElementById("nav-search-employee");

    if (!nav) {
        return;
    }


    // =====================================================
    // TOGGLE COMPACT NAV STATE
    // =====================================================

    function onScroll() {

        if (window.scrollY > SCROLL_THRESHOLD) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    onScroll();


    // =====================================================
    // SYNC NAV SEARCH <-> MAIN SEARCH
    // =====================================================

    if (mainSearch && navSearch) {

        navSearch.addEventListener("input", () => {

            mainSearch.value = navSearch.value;

            // payroll.js listens for "input" on #search-employee
            mainSearch.dispatchEvent(new Event("input", { bubbles: true }));
        });

        mainSearch.addEventListener("input", () => {

            if (navSearch.value !== mainSearch.value) {
                navSearch.value = mainSearch.value;
            }
        });
    }

})();