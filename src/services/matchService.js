/**
 * Tournament Config & Match Service Data Layer
 * 
 * Drives the Tournament Banner and Match Listing for Live, Upcoming, and Completed views.
 * TODO: Replace mock functions with real backend API requests (e.g., GET /api/tournaments/:id/matches?view=live)
 */

export const tournamentConfig = {
  id: "mapl-2026",
  name: "MAPL 2026",
  location: "Gandhidham",
  viewCount: 6933,
  dateRange: "25-09-2026 to 27-09-2026",
  logoUrl: null, // Placeholder cricket logo when null
  totalMatches: 45,
  totalTeams: 20,
  contactEmail: "contact@mapl2026.com",
};

export const getTournamentMatches = (view = 'live') => {
  const matchesData = {
    live: [
      {
        matchId: "match-101",
        tournamentName: "MAPL 2026",
        groupLabel: "Quarter Final",
        ground: "Sun Valley Ground, Gandhidham",
        city: "Gandhidham",
        details: "Type B, Rs. 5000 Entry",
        date: "26-Sep-2026",
        oversLabel: "20 Ov.",
        status: "live",
        teamA: {
          name: "SIPL WARRIORS",
          logoColor: "#dc2626", // Red theme accent
          logoText: "S",
          score: "54/6",
          overs: "8.4 ov",
          hasBatted: true,
          isBatting: true,
        },
        teamB: {
          name: "KANDLA TIGERS",
          logoColor: "#059669", // Green theme accent
          logoText: "K",
          score: null,
          overs: null,
          hasBatted: false,
          isBatting: false,
        },
        statusStripText: "won the toss and elected to bat",
        statusStripBold: "SIPL WARRIORS",
        statusStripType: "toss",
      },
      {
        matchId: "match-102",
        tournamentName: "MAPL 2026",
        groupLabel: "Group Stage - Group A",
        ground: "Kutch Cricket Association Ground",
        city: "Gandhidham",
        details: "Type A Turf Ground",
        date: "26-Sep-2026",
        oversLabel: "20 Ov.",
        status: "live",
        teamA: {
          name: "BHUJ ROYALS",
          logoColor: "#2563eb", // Blue theme accent
          logoText: "B",
          score: "142/5",
          overs: "16.2 ov",
          hasBatted: true,
          isBatting: true,
        },
        teamB: {
          name: "GANDHIDHAM KINGS",
          logoColor: "#d97706", // Amber theme accent
          logoText: "G",
          score: "110/8",
          overs: "15.0 ov",
          hasBatted: true,
          isBatting: false,
        },
        statusStripText: "need 33 runs in 22 balls to win",
        statusStripBold: "BHUJ ROYALS",
        statusStripType: "progress",
      }
    ],
    upcoming: [
      {
        matchId: "match-201",
        tournamentName: "MAPL 2026",
        groupLabel: "Semi Final 1",
        ground: "Sun Valley Sports Complex",
        city: "Gandhidham",
        details: "Type A Turf Pitch",
        date: "27-Sep-2026",
        oversLabel: "20 Ov.",
        status: "upcoming",
        startTime: "04:00 PM IST",
        teamA: {
          name: "ANJAR STRIKERS",
          logoColor: "#7c3aed", // Purple
          logoText: "A",
          score: null,
          overs: null,
          hasBatted: false,
          isBatting: false,
        },
        teamB: {
          name: "MANDVI SEAGULLS",
          logoColor: "#0891b2", // Cyan
          logoText: "M",
          score: null,
          overs: null,
          hasBatted: false,
          isBatting: false,
        },
        statusStripText: "Match starts today at 04:00 PM • Toss at 03:30 PM",
        statusStripBold: "Semi Final 1",
        statusStripType: "upcoming",
      },
      {
        matchId: "match-202",
        tournamentName: "MAPL 2026",
        groupLabel: "Semi Final 2",
        ground: "Jubilee Cricket Ground",
        city: "Bhuj",
        details: "Type B Ground",
        date: "27-Sep-2026",
        oversLabel: "20 Ov.",
        status: "upcoming",
        startTime: "07:30 PM IST",
        teamA: {
          name: "ADANI TITANS",
          logoColor: "#e11d48", // Rose
          logoText: "A",
          score: null,
          overs: null,
          hasBatted: false,
          isBatting: false,
        },
        teamB: {
          name: "WELSPUN WOLVES",
          logoColor: "#4f46e5", // Indigo
          logoText: "W",
          score: null,
          overs: null,
          hasBatted: false,
          isBatting: false,
        },
        statusStripText: "Scheduled for tomorrow evening • Gate opens at 06:30 PM",
        statusStripBold: "Semi Final 2",
        statusStripType: "upcoming",
      }
    ],
    completed: [
      {
        matchId: "match-301",
        tournamentName: "MAPL 2026",
        groupLabel: "Group B - Match 12",
        ground: "Kutch Cricket Association Ground",
        city: "Gandhidham",
        details: "Day Match",
        date: "25-Sep-2026",
        oversLabel: "20 Ov.",
        status: "completed",
        teamA: {
          name: "KUTCH SUPER KINGS",
          logoColor: "#ca8a04", // Yellow/Gold
          logoText: "K",
          score: "186/4",
          overs: "20.0 ov",
          hasBatted: true,
          isBatting: false,
        },
        teamB: {
          name: "MUNDRA LIONS",
          logoColor: "#0284c7", // Sky blue
          logoText: "M",
          score: "162/9",
          overs: "20.0 ov",
          hasBatted: true,
          isBatting: false,
        },
        statusStripText: "won by 24 runs",
        statusStripBold: "KUTCH SUPER KINGS",
        statusStripType: "result",
      },
      {
        matchId: "match-302",
        tournamentName: "MAPL 2026",
        groupLabel: "Quarter Final 2",
        ground: "Sun Valley Ground",
        city: "Gandhidham",
        details: "Knockout Match",
        date: "25-Sep-2026",
        oversLabel: "20 Ov.",
        status: "completed",
        teamA: {
          name: "HARBOR DAREDEVILS",
          logoColor: "#9333ea", // Purple
          logoText: "H",
          score: "128/10",
          overs: "18.2 ov",
          hasBatted: true,
          isBatting: false,
        },
        teamB: {
          name: "PORT RAIDERS",
          logoColor: "#16a34a", // Green
          logoText: "P",
          score: "132/4",
          overs: "16.1 ov",
          hasBatted: true,
          isBatting: false,
        },
        statusStripText: "won by 6 wickets (23 balls left)",
        statusStripBold: "PORT RAIDERS",
        statusStripType: "result",
      }
    ]
  };

  return matchesData[view] || matchesData.live;
};
