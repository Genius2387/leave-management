import { createContext } from 'react';
import leaveStore from '../store/leaveStore';

// Context carries the leaveStore singleton.
// Class components access it via: static contextType = AppContext
const AppContext = createContext(leaveStore);

export default AppContext;
