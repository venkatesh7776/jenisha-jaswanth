/* ------------------------------------------------------------------
   EDIT EVERYTHING HERE — names, dates, venues, RSVP, music.
------------------------------------------------------------------- */
window.WEDDING = {
  bride: { name: "Jenisha", parents: "D/o Mr. A David & Mrs. Sharal David" },
  groom: { name: "Jaswanth", parents: "S/o (Late) Mr. Nagarajan YMG & Mrs. Saraswathi N" },

  city: "Bengaluru, Karnataka",
  weddingDate: "2027-01-20T10:00:00+05:30",   // countdown target
  journeyStart: "2026-11-24T00:00:00+05:30",  // start of the gold "Today -> 20.01.2027" line

  verse: "I have found the one whom my soul loves.",
  verseRef: "Song of Solomon 3:4",

  events: [
    {
      key: "wedding",
      title: "The Wedding",
      start: "2027-01-20T10:00:00+05:30",
      end: "2027-01-20T12:00:00+05:30",
      dateText: "Wednesday, 20th January 2027",
      timeText: "10:00 AM",
      venue: "CSI St. Mark’s Cathedral",
      address: "1, Mahatma Gandhi Rd, Shivaji Nagar, Bengaluru, Karnataka 560001",
      mapQuery: "CSI St. Mark's Cathedral, 1, Mahatma Gandhi Rd, Shanthala Nagar, Shivaji Nagar, Bengaluru, Karnataka 560001",
      mapUrl: "https://maps.app.goo.gl/qagrZf1JSQGNyMW9A",
    },
    {
      key: "reception",
      title: "The Reception",
      start: "2027-01-20T12:00:00+05:30",
      end: "2027-01-20T16:00:00+05:30",
      dateText: "Wednesday, 20th January 2027",
      timeText: "From 12:00 PM",
      venue: "Zion – A Luxurious Hotel",
      address: "1st Floor, 31, WH Hanumanthappa Rd, Gandhi Nagar, Bengaluru, Karnataka 560009",
      mapQuery: "Zion - A Luxurious Hotel, 31, WH Hanumanthappa Rd, Gandhi Nagar, Bengaluru, Karnataka 560009",
      mapUrl: "https://maps.app.goo.gl/RrgkM5S2vgEAYNTN9",
    },
  ],

  rsvp: {
    // Google Apps Script web-app URL (or any endpoint accepting a JSON POST). Empty = saved in the browser only.
    endpoint: "https://script.google.com/macros/s/AKfycbxhVrIbEEXNcZip8oF6AlMKPBZPQMk0ReRDyrwL0hKq8H37ckGYl8mjaUsWsRd4XKTKAA/exec",
  },

  // Photo gallery (3D coverflow). Add more photos to assets/img/gallery/ and list them here.
  gallery: [
    "assets/img/gallery/g01.webp",
    "assets/img/gallery/g02.webp",
    "assets/img/gallery/g03.webp",
    "assets/img/gallery/g04.webp",
  ],

  endNote: "Your presence and blessings would mean the world to us as we begin this beautiful journey together.",
  music: "assets/audio/song.mp3",
};
