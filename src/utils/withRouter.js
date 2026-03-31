import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

/**
 * withRouter HOC
 *
 * React Router v6 removed the withRouter HOC and class-component support.
 * This HOC bridges that gap: it wraps a class component with a functional
 * component shell that injects router props (location, navigate, params).
 *
 * Usage:
 *   export default withRouter(observer(MyClassComponent));
 *
 * Inside the class component:
 *   this.props.location   → current location object
 *   this.props.navigate   → navigate function
 *   this.props.params     → URL params
 *
 * NOTE: We intentionally do NOT use useSearchParams here; the class
 * components parse location.search manually via new URLSearchParams().
 */
function withRouter(WrappedComponent) {
  function WithRouterWrapper(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    return (
      <WrappedComponent
        {...props}
        location={location}
        navigate={navigate}
        params={params}
      />
    );
  }

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithRouterWrapper.displayName = `withRouter(${displayName})`;

  return WithRouterWrapper;
}

export default withRouter;
