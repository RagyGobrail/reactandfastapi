import React, { useEffect, useState, useRef } from 'react';

const Header = ({ setDiscoverMode }) => {
    const [hideNavbar, setHideNavbar] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [discoverOpen, setDiscoverOpen] = useState(false);

    const dropdownRef = useRef(null);
    const discoverRef = useRef(null);

    // Extract access_token from URL fragment and store it
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes("access_token")) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get("access_token");
            if (token) {
                localStorage.setItem("spotify_access_token", token);
                localStorage.setItem("spotify_token_time", Date.now().toString());
                window.location.hash = "";
                window.location.reload();
            }
        }
    }, []);

    // Auto-logout if token expired
    useEffect(() => {
        const token = localStorage.getItem("spotify_access_token");
        const time = localStorage.getItem("spotify_token_time");
        if (token && time) {
            const elapsed = (Date.now() - parseInt(time, 10)) / 1000;
            if (elapsed > 3600) {
                localStorage.removeItem("spotify_access_token");
                localStorage.removeItem("spotify_token_time");
            }
        }
    }, []);

    // Hide navbar on scroll
    useEffect(() => {
        const handleScroll = () => {
            setHideNavbar(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch user profile if token is available
    useEffect(() => {
        const token = localStorage.getItem("spotify_access_token");
        if (token) {
            fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setUser({
                        name: data.display_name,
                        image: data.images?.[0]?.url || null
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch user profile:", err);
                });
        }
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                (dropdownRef.current && !dropdownRef.current.contains(event.target)) &&
                (discoverRef.current && !discoverRef.current.contains(event.target))
            ) {
                setDropdownVisible(false);
                setDiscoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loginToSpotify = () => {
        const SPOTIFY_CLIENT_ID = "69502891fbf84d65b1b8f6815894e7e7";
        const REDIRECT_URI = "http://localhost:5173/";
        const SCOPES = "playlist-modify-public playlist-modify-private";
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
        window.location.href = authUrl;
    };

    const logoutFromSpotify = () => {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_token_time");
        window.location.reload();
    };

    return (
        <header className={`header ${hideNavbar ? 'hide-navbar' : ''}`}>
            <a href="#" className="logo">HarmoN雅</a>
            <nav className="navbar">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setDiscoverMode(null); // This will reset to show FeatureShowcase
                        setDropdownVisible(false);
                        setDiscoverOpen(false);
                    }}
                >
                    Home
                </a>

                <div className="discover-menu" ref={discoverRef}>
                    <div className="discover-wrapper">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setDiscoverOpen(prev => !prev);
                                setDropdownVisible(false);
                            }}
                        >
                            Discover ▾
                        </a>
                        {discoverOpen && (
                            <div className="dropdown-discover">
                                <button onClick={() => setDiscoverMode("taste")}>Discover by my Taste</button>
                                <button onClick={() => setDiscoverMode("mood")}>Discover by my Mood</button>
                                <button onClick={() => setDiscoverMode("analyze")}>Analyze my Playlist</button>
                            </div>
                        )}
                    </div>
                </div>

                <a href="#">About</a>

                {user ? (
                    <div className="user-menu" ref={dropdownRef}>
                        <img
                            src={user.image || "https://via.placeholder.com/40"}
                            alt="User"
                            className="user-avatar"
                            onClick={() => {
                                setDropdownVisible(prev => !prev);
                                setDiscoverOpen(false);
                            }}
                        />
                        {dropdownVisible && (
                            <div className="dropdown-user">
                                <span className="user-name">{user.name}</span>
                                <button onClick={logoutFromSpotify}>Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <a href="#" id="spotifyLoginButton" onClick={loginToSpotify}>Login into Spotify</a>
                )}
            </nav>
        </header>
    );
};

export default Header;
