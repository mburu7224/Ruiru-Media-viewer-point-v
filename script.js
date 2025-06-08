// --- Firebase Configuration and Initialization ---
// IMPORTANT: This is your specific project's connection details.
const firebaseConfig = {
    apiKey: "AIzaSyD_AnGX-RO7zfM_rCBopJmdv3BOVE4V-_o",
    authDomain: "media-app-a702b.firebaseapp.com",
    projectId: "media-app-a702b",
    storageBucket: "media-app-a702b.firebasestorage.app",
    messagingSenderId: "60484045851",
    appId: "1:60484045851:web:f1bb588c2d5edc177ffcbe",
    measurementId: "G-LPBXF7MLWF"
};

// Import Firebase functions from CDN (no addDoc/deleteDoc needed for viewer)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
// Removed orderBy as per request

// Initialize Firebase app and Firestore database instance
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const contentCollectionRef = collection(db, "content_items");

// --- Global Variables and DOM Elements ---
let activeSection = 'home';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebarWrapper = document.querySelector('.sidebar-wrapper');
    const menuToggle = document.querySelector('.menu-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const searchInput = document.getElementById('searchInput');

    // --- Mobile Hamburger Menu Toggle ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebarWrapper.classList.toggle('active');
        });
    }

    // --- Navigation and Content Switching Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = e.currentTarget.dataset.section + '-section';
            const targetSectionName = e.currentTarget.dataset.section;

            activeSection = targetSectionName;
            searchInput.value = ''; // Clear search input visually
            currentSearchTerm = ''; // Reset search term state


            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            e.currentTarget.classList.add('active');
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                // --- Mobile: Auto-close sidebar after selection ---
                if (window.innerWidth <= 768 && sidebarWrapper.classList.contains('active')) {
                    sidebarWrapper.classList.remove('active');
                }
            }

            if (activeSection !== 'home') {
                loadContentFirebase(activeSection, currentSearchTerm);
            }
        });
    });

    // --- Search Functionality ---
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value.trim();
        if (activeSection !== 'home') {
            loadContentFirebase(activeSection, currentSearchTerm);
        }
    });

    // --- Helper Functions ---

    /**
     * Extracts YouTube video ID from various YouTube URL formats.
     */
    function getYouTubeVideoId(url) {
        let videoId = null;
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
        const match = url.match(regex);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId;
    }

    /**
     * Loads and displays content for a specific section from Firestore.
     * Uses a real-time listener (onSnapshot), includes search.
     */
    function loadContentFirebase(section, searchTerm = '') {
        const contentContainer = document.getElementById(`${section}-container`);
        if (!contentContainer) {
            console.warn(`Content container for section "${section}" not found.`);
            return;
        }

        // Removed loading indicator logic here

        let q = query(
            contentCollectionRef,
            where("category", "==", section)
            // Removed orderBy("timestamp", "desc")
        );

        onSnapshot(q, (snapshot) => {
            // Removed loading indicator logic here

            // Client-side filter for search term
            let filteredDocs = [];
            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                snapshot.forEach(docSnapshot => {
                    const item = docSnapshot.data();
                    if (item.title.toLowerCase().includes(lowerSearchTerm) ||
                        (item.description && item.description.toLowerCase().includes(lowerSearchTerm))) {
                        filteredDocs.push({ id: docSnapshot.id, data: item });
                    }
                });
            } else {
                snapshot.forEach(docSnapshot => {
                    filteredDocs.push({ id: docSnapshot.id, data: docSnapshot.data() });
                });
            }

            contentContainer.innerHTML = '';

            if (filteredDocs.length === 0) {
                contentContainer.innerHTML = '<p class="text-center-message">No content found in this category' + (searchTerm ? ` for "${searchTerm}"` : '') + '.</p>';
                return;
            }

            filteredDocs.forEach(docItem => {
                const item = docItem.data;
                const docId = docItem.id;

                const contentItemDiv = document.createElement('div');
                contentItemDiv.classList.add('content-item');

                let mediaContent = '';
                const youtubeId = item.url ? getYouTubeVideoId(item.url) : null;

                if (youtubeId) {
                    // Directly embed YouTube iframe (no thumbnail preview)
                    mediaContent = `
                        <div class="video-container">
                            <iframe
                                src="https://www.youtube.com/embed/${youtubeId}?rel=0"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                title="${item.title || 'YouTube video player'}"
                            ></iframe>
                        </div>
                    `;
                } else if (item.url) {
                    mediaContent = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">View Content</a>`;
                }

                contentItemDiv.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    ${mediaContent}
                `;
                contentContainer.appendChild(contentItemDiv);
            });
        }, (error) => {
            console.error("Error fetching documents from Firestore: ", error);
            contentContainer.innerHTML = '<p class="text-center-message">Error loading content. Please check your internet connection and Firebase rules.</p>';
        });
    }

    // --- Initial Page Load ---
    const initialNavItem = document.querySelector('.nav-item[data-section="home"]');
    if (initialNavItem) {
        initialNavItem.click();
    }
});