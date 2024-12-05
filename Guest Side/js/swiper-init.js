// Initialize Swiper for home slider
var swiper = new Swiper(".home-slider", {
    loop: true,
    effect: "coverflow",
    spaceBetween: 30,
    grabCursor: true,
    coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: false,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});

// Initialize Swiper for gallery slider
var swiper = new Swiper(".gallery-slider", {
    loop: true,
    effect: "coverflow",
    slidesPerView: "auto",
    centeredSlides: true,
    grabCursor: true,
    coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 2,
        slideShadows: true,
    },
    pagination: {
        el: ".swiper-pagination",
    },
});

// Initialize Swiper for reviews slider
var swiper = new Swiper(".reviews-slider", {
    loop: true,
    slidesPerView: "auto",
    grabCursor: true,
    spaceBetween: 30,
    pagination: {
        el: ".swiper-pagination",
    },
    breakpoints: {
        768: {
            slidesPerView: 1,
        },
        991: {
            slidesPerView: 2,
        },
    },
});
