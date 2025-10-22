import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  CloudSun,
  LogOut,
  BookOpen,
  Globe,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { usePlayerMessages } from "@/hooks/usePlayerMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/LogoutButton";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { themePreference, appliedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: userLogout } = useAuth();
  const {
    admin,
    isAdmin,
    logout: adminLogout,
    unreadMessageCount,
  } = useAdmin();
  const {
    unreadCount: playerUnreadCount,
    fetchUnreadCount: fetchPlayerUnreadCount,
  } = usePlayerMessages(user?.email);

  // Refresh player message count when messages are read
  useEffect(() => {
    const handlePlayerMessagesRead = () => {
      console.log("Navbar received playerMessagesRead event");
      fetchPlayerUnreadCount();
    };

    window.addEventListener("playerMessagesRead", handlePlayerMessagesRead);

    return () => {
      window.removeEventListener(
        "playerMessagesRead",
        handlePlayerMessagesRead
      );
    };
  }, [fetchPlayerUnreadCount]);

  // Log player unread count for debugging
  useEffect(() => {
    console.log("Player unread count updated:", playerUnreadCount);
  }, [playerUnreadCount]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getThemeIcon = () => {
    if (themePreference === "auto") {
      return <CloudSun className="h-5 w-5" />;
    }
    return appliedTheme === "dark" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Moon className="h-5 w-5" />
    );
  };

  const getThemeLabel = () => {
    if (themePreference === "auto") return "Auto";
    return appliedTheme === "dark"
      ? language === "fr"
        ? "Mode clair"
        : "Light Mode"
      : language === "fr"
      ? "Mode sombre"
      : "Dark Mode";
  };

  const handleAdminLogout = async () => {
    console.log("Admin logout clicked");
    await adminLogout();
    console.log("Admin logout completed");
    navigate("/admin");
  };

  const handleUserLogout = async () => {
    console.log("User logout clicked");
    await userLogout();
    console.log("User logout completed");
    navigate("/");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  // Build nav links dynamically based on user status
  const getPlayerNavLinks = () => [
    { name: t("navbar.home"), href: "/" },
    { name: t("navbar.leaderboard"), href: "/leaderboard" },
    { name: t("navbar.learning"), href: "/learning" },
    {
      name: language === "en" ? "Monthly Winners" : "Gagnants du Mois",
      href: "/monthly-winners",
    },
  ];

  const getAdminNavLinks = () => [
    { name: t("navbar.home"), href: "/" },
    { name: t("navbar.leaderboard"), href: "/leaderboard" },
    { name: t("navbar.learning"), href: "/learning" },
    {
      name: language === "en" ? "Quiz Scores" : "Scores du Quiz",
      href: "/quiz-scores",
    },
    {
      name: language === "en" ? "Monthly Winners" : "Gagnants du Mois",
      href: "/monthly-winners",
    },
  ];

  const navLinks = isAdmin
    ? getAdminNavLinks()
    : user
    ? getPlayerNavLinks()
    : [
        { name: t("navbar.home"), href: "/" },
        { name: t("navbar.leaderboard"), href: "/leaderboard" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-battle-purple/20">
      <div className="container mx-auto px-4">
        {/* Two-line layout for mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo and Institute Name - aligned to the left */}
            <div className="flex items-center flex-1 min-w-0 z-10">
              <div className="flex-shrink-0">
                <img
                  src="/ofppt logo.png"
                  alt="OFPPT Logo"
                  className="h-10 w-auto"
                />
              </div>
              <div className="ml-2 min-w-0">
                <div className="text-xs font-medium text-foreground flex flex-col bg-background/80 backdrop-blur-sm rounded-lg py-1 px-2">
                  {t("navbar.institute").split(" ").length > 3 ? (
                    <>
                      <span className="leading-tight truncate">
                        {t("navbar.institute").split(" ").slice(0, 2).join(" ")}
                      </span>
                      <span className="leading-tight truncate">
                        {t("navbar.institute").split(" ").slice(2).join(" ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] leading-tight truncate">
                        {t("navbar.institute").split(" ").slice(0, 3).join(" ")}
                      </span>
                      <span className="text-[11px] leading-tight truncate">
                        {t("navbar.institute").split(" ").slice(3).join(" ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button with user initials - right aligned */}
            <div className="flex items-center ml-auto z-10">
              {user || isAdmin ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (isAdmin) {
                        // Emit event to open messages panel directly
                        // This should work on any page without navigation
                        window.dispatchEvent(
                          new CustomEvent("openMessagesPanel")
                        );
                      } else {
                        // Emit event to open messages panel directly
                        window.dispatchEvent(
                          new CustomEvent("openPlayerMessagesPanel")
                        );
                      }
                    }}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground mr-2 relative"
                    title="Messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {isAdmin && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                    {!isAdmin && playerUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {playerUnreadCount > 99 ? "99+" : playerUnreadCount}
                      </span>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center bg-gradient-to-r from-battle-purple to-indigo-600 rounded-full w-10 h-10 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer justify-center">
                        <span className="text-sm font-bold text-white">
                          {user
                            ? user.full_name
                              ? user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                              : "U"
                            : "A"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {/* Navigation Links */}
                      <div className="px-2 py-2">
                        {navLinks.map((link) => (
                          <DropdownMenuItem
                            key={link.name}
                            onClick={() => {
                              navigate(link.href);
                              setIsMenuOpen(false);
                            }}
                            className={`cursor-pointer ${
                              location.pathname === link.href ? "font-bold" : ""
                            }`}
                          >
                            {link.name}
                          </DropdownMenuItem>
                        ))}
                      </div>
                      <DropdownMenuSeparator />

                      {user && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              navigate("/profile");
                              setIsMenuOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <UserIcon className="w-4 h-4 mr-2" />
                            Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              navigate("/admin/dashboard");
                              setIsMenuOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            {t("navbar.dashboard")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getThemeIcon()}
                            <span className="ml-2 text-sm">
                              {getThemeLabel()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTheme();
                              setIsMenuOpen(false);
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle theme</span>
                            <span
                              className={`${
                                appliedTheme === "dark"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {language === "en" ? "English" : "Français"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLanguage();
                              setIsMenuOpen(false);
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle language</span>
                            <span
                              className={`${
                                language === "fr"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <LogoutButton variant="dropdown" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLanguage}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground mr-2"
                    title={language === "en" ? "Français" : "English"}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground mr-2"
                    title={getThemeLabel()}
                  >
                    {getThemeIcon()}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMenu}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Single-line layout for desktop */}
        <div className="hidden md:flex items-center justify-between h-16 w-full">
          {/* Logo and Institute Name */}
          <div className="flex-shrink-0 flex items-center">
            <img
              src="/ofppt logo.png"
              alt="OFPPT Logo"
              className="h-10 w-auto"
            />
            <div className="ml-3 text-sm font-medium text-foreground flex flex-col justify-center">
              {t("navbar.institute").split(" ").length > 3 ? (
                <>
                  <span>
                    {t("navbar.institute").split(" ").slice(0, 2).join(" ")}
                  </span>
                  <span>
                    {t("navbar.institute").split(" ").slice(2).join(" ")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[13px]">
                    {t("navbar.institute").split(" ").slice(0, 3).join(" ")}
                  </span>
                  <span className="text-[13px]">
                    {t("navbar.institute").split(" ").slice(3).join(" ")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav
            className={`flex items-center ${
              isAdmin ? "ml-12" : ""
            } absolute left-1/2 transform -translate-x-1/2`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`${
                  location.pathname === link.href
                    ? "text-foreground font-bold border-b-2 border-purple-700"
                    : "text-foreground/80 hover:text-foreground hover:border-b-2 hover:border-purple-700/50"
                } transition-all duration-300 ease-in-out font-medium border-b-2 border-transparent mx-4 whitespace-nowrap ${
                  language === "fr" ? "text-sm" : "text-base"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <div className="flex items-center space-x-3 mr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Emit event to open messages panel directly
                      // This should work on any page without navigation
                      window.dispatchEvent(
                        new CustomEvent("openMessagesPanel")
                      );
                    }}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground relative"
                    title={t("navbar.messages")}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center bg-gradient-to-r from-battle-purple to-indigo-600 rounded-full px-4 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                        <span className="text-xs font-semibold text-white mr-2">
                          ADMIN
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-white"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/dashboard")}
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t("navbar.dashboard")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getThemeIcon()}
                            <span className="ml-2 text-sm">
                              {getThemeLabel()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle theme</span>
                            <span
                              className={`${
                                appliedTheme === "dark"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {language === "en" ? "English" : "Français"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLanguage();
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle language</span>
                            <span
                              className={`${
                                language === "fr"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleAdminLogout}
                        className="cursor-pointer text-red-500 focus:text-red-500"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("navbar.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Emit event to open messages panel directly
                      window.dispatchEvent(
                        new CustomEvent("openPlayerMessagesPanel")
                      );
                    }}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground relative"
                    title="Messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {playerUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {playerUnreadCount > 99 ? "99+" : playerUnreadCount}
                      </span>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center bg-gradient-to-r from-battle-purple to-indigo-600 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                        <span className="text-xs font-medium text-white mr-1">
                          {user.full_name}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-white"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          navigate("/profile");
                        }}
                        className="cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getThemeIcon()}
                            <span className="ml-2 text-sm">
                              {getThemeLabel()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle theme</span>
                            <span
                              className={`$ ${
                                appliedTheme === "dark"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {language === "en" ? "English" : "Français"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLanguage();
                            }}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-battle-purple/30 transition-colors focus:outline-none focus:ring-2 focus:ring-battle-purple focus:ring-offset-2"
                          >
                            <span className="sr-only">Toggle language</span>
                            <span
                              className={`${
                                language === "fr"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <LogoutButton variant="dropdown" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                !isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleLanguage}
                      className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
                      title={language === "en" ? "Français" : "English"}
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
                      title={getThemeLabel()}
                    >
                      {getThemeIcon()}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                    >
                      {t("navbar.login")}
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://css-battle-isfo.vercel.app/",
                          "_blank"
                        )
                      }
                      className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {t("navbar.register")}
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-battle-purple/20">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`${
                    location.pathname === link.href
                      ? "text-foreground font-bold border-b-2 border-purple-700"
                      : "text-foreground/80 hover:text-foreground hover:border-b-2 hover:border-purple-700/50"
                  } transition-all duration-300 ease-in-out font-medium border-b-2 border-transparent px-2 py-1 whitespace-nowrap ${
                    language === "fr" ? "text-sm" : "text-base"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                {!user && !isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                    >
                      {t("navbar.login")}
                    </Button>
                    <Button
                      onClick={() => {
                        window.open(
                          "https://css-battle-isfo.vercel.app/",
                          "_blank"
                        );
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {t("navbar.register")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
