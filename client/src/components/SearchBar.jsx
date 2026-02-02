import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import './SearchBar.css';

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/feed?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="searchbar">
      <form className="searchbar-form" onSubmit={onSubmit}>
        <Search size={20} className="searchbar-icon" />
        <input
          className="searchbar-input"
          type="text"
          placeholder="Search creators, topics, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="searchbar-button" type="submit">Search</button>
      </form>
    </div>
  );
}

export default SearchBar;
