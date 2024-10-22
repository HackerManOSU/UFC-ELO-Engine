import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './header.css'

interface HeaderProps {
    toggleNavbar: () => void;
  }
  
  const Header: React.FC<HeaderProps> = ({ toggleNavbar }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    const toggleMenu = () => {
      if (isOpen) {
        // Set up to trigger slideUp animation
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.add('dropdown-exit');
          setTimeout(() => {
            setIsOpen(false);
            const dropdownMenuAfterTimeout = document.querySelector('.dropdown-menu');
            if (dropdownMenuAfterTimeout) {
              dropdownMenuAfterTimeout.classList.remove('dropdown-exit');
            }
          }, 100); // Duration of the slideUp animation
        }
      } else {
        setIsOpen(true);
      }
    };
  
    const handleLinkClick = () => {
      if (window.innerWidth < 1024) {
        toggleNavbar();
        toggleMenu();
      }
    };  
  
    return (
      <>
        <header
          className={'header flex w-screen min-h-[90px] h-[8vh] justify-center bg-black px-4 py-1 relative z-20 border-b-4 border-[#d40101]'}
        >
          <nav className="flex justify-center w-[95%] max-w-[1200px] items-center">
  
            <ul className="flex justify-between text:lg text-center items-center text-white w-[100%] max-w-[800px]">

                <li>
                    <Link
                        to="/"
                        className="link hover:text-[#ff817e] block py-2 lg:py-0 font-bold"
                        onClick={handleLinkClick}
                    >
                        Fighter Rankings
                    </Link>
                </li>
            
                <li>
                    <div className="Logo flex justify-center items-center w-[100px] h-100px]">
                        <Link to="/" className="">
                            <img
                            src="/UFC-Logo.png"
                            className=""
                            />
                        </Link>
                    </div>
                </li>


                <li>
                    <Link
                        to="/FighterProfiles"
                        className="link hover:text-[#ff817e] block py-2 lg:py-0 font-bold"
                        onClick={handleLinkClick}
                    >
                        Fighter Profiles
                    </Link>
                </li>

            </ul>
          </nav>
        </header>
      </>
    );
  };
  
  export default Header;