/**
 * LoveProject Configuration
 * Created by Bibesh
 * Personalized for Bibesh & Anushka
 * First message: April 13, 2025, 12:32 AM (EST)
 */

const CONFIG = {
    // Anniversary date - When we first texted
    // Format: new Date(YEAR, MONTH (0-11), DAY, HOUR, MINUTE, SECOND)
    anniversaryDate: new Date(2025, 3, 13, 0, 32, 0),
    
    // Recipient's name
    recipientName: "Anushka",
    
    // Sender's name
    senderName: "BIBESH",
    
    // Main message inside the heart
    message: "I LOVE YOU SO MUCH",
    
    // Poem/Letter text - Edit the HTML in index.html #code div
    // to customize the personal love letter
    
    // Animation settings
    animationSettings: {
        typewriterSpeed: 75,        // ms per character (poem typing speed)
        heartAnimationDelay: 5000,  // ms before heart animation starts
        messagesDelay: 5000,        // ms for countdown to fade in
        loveuDelay: 3000            // ms for "I love you" message to fade in
    },
    
    // Garden/Bloom settings (particle effects inside heart)
    gardenSettings: {
        bloomMinRadius: 8,
        bloomMaxRadius: 10,
        bloomMinCount: 8,
        bloomMaxCount: 15,
        growSpeed: 1000 / 60        // 60 FPS for smooth animation
    }
};

// Notes:
// - The poem is in index.html inside #code div
// - The heart overlay message uses CONFIG.message and CONFIG.senderName
// - Countdown shows: days/hours/minutes/seconds, months/days, and decimal years
