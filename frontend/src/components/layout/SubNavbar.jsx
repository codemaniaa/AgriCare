import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaAppleAlt, FaLeaf, FaSeedling, FaTools,FaHome, FaChat,FaBox,FaGavel, FaFileInvoice, FaComments, FaUser } from "react-icons/fa";
import { GiWheat, GiCow, GiPlantRoots } from "react-icons/gi";

const CATS = [
  { label:'All', value:'', emoji:'🏪' },
  { label:'Grains', value:'grains', emoji:<GiWheat /> },
  { label:'Fruits', value:'fruits', emoji:<FaAppleAlt /> },
  { label:'Vegetables', value:'vegetables', emoji:<FaLeaf /> },
  { label:'Livestock', value:'livestock', emoji:<GiCow /> },
  { label:'Tools', value:'tools', emoji:<FaTools /> },
  { label:'Fertilizers', value:'fertilizers', emoji:<GiPlantRoots /> },
];
const user = JSON.parse(localStorage.getItem("user"));
export function SubNavbar({ activeCategory = '', onCategoryChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (value) => {
    // ✅ Update parent state
    onCategoryChange && onCategoryChange(value);

    // ✅ Update URL (VERY IMPORTANT)
    const params = new URLSearchParams(location.search);

    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }

    navigate({
      pathname: '/',
      search: params.toString(),
    });
  };

return (
    <div className="bg-white border-b border-gray-200"> 
      <div className="flex overflow-x-auto no-scrollbar px-2">

        {CATS.map((c) => {
          const active = activeCategory === c.value;

          return (
            <button key={c.value}  onClick={() => handleClick(c.value)}
              className={` flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition shrink-0 
                ${active ? 'text-green-700 border-green-700 bg-green-50' : 'text-gray-500 border-transparent hover:text-green-600'} `} >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          );
        })}

      </div>
    </div>
  );
}

/*  BottomNav (Mobile Only)  */
export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ITEMS = [
    { label:'Home',     icon:<FaHome />, path:'/' },
    { label:'Products', icon:<FaBox />, path:'/products', auth:true },
    { label:'Auctions', icon:<FaGavel />, path:'/auctions' },
    { label:'Orders',   icon:<FaFileInvoice />, path:'/orders', auth:true },
    { label:'Chat',     icon:<FaComments />, path:'/chat', auth:true },
    { label:'More',     icon:<FaUser />, path: user ? '/dashboard' : '/signin' },
  ];

  const go = (item) => {
    if (item.auth && !user) {
      navigate('/signin');
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent md:mx-[25%] border-gray-200 flex justify-around items-center py-2 md:w-[50%]  ">

      {ITEMS.map((item) => {
        const active =  location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

        return (
          <>
           <button
            key={item.label}
            onClick={() => go(item)}
            className={`flex flex-col items-center text-xs ${
              active ? 'text-green-700 font-semibold' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            
          </button>
       
          </>
         

        );
      })}

    </nav>
  );
}

