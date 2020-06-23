import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatic from 'hoist-non-react-statics';

import _ from 'lodash';

import tachyonsJs from 'tachyons';
import styled, { css } from 'styled-components';

const cssify = (styles, theme) => _.map(styles, (rules, selector) => {
  if (_.isObject(rules)) {
    return css`
      ${selector.replace(/^:/g, '&:')} {
        ${cssify(rules, theme)}
      }
    `;
  } else if (_.isString(rules)) {
    return {
      [selector]: rules.replace(/var\(--([A-z\d-]+)\)/g, (match, name) => (
        theme[name.replace(/-/g, '_')]
      )),
    };
  }

  return { [selector]: rules };
});

const pseudoify = (pseudoElement, propName = pseudoElement) => (props) => {
  const value = props[propName];
  if (!value) { return null; }

  const normalisedValue = _.isString(value) ? value : _.flatten(value).join(' ');
  return css`
    &:${pseudoElement} {
      ${_.map(normalisedValue.split(' '), (prop) => cssify(tachyonsJs[prop], props.theme))}
    }
  `;
};

const CleanComponent = (Component) => {
  const CleanedComponent = (props) => {
    const cleanProps = _.omit(props, [
      'nodeRef',
      'disable',
      'focus',
      'hover',
      'active',
      ..._.keys(tachyonsJs),
    ]);

    return React.createElement(Component, { ref: props.nodeRef, ...cleanProps });
  }

  hoistNonReactStatic(CleanedComponent, Component);

  return CleanedComponent;
};

const tachyons = (props) => (
  _.map(props, (on, prop) => on ? cssify(tachyonsJs[prop], props.theme) : undefined)
);
const tachyoned = _.memoize((component) => styled(CleanComponent(component))`
  ${tachyons}
  ${pseudoify('disabled', 'disable')}
  ${pseudoify('focus')}
  ${pseudoify('hover')}
  ${pseudoify('active')}
`);

export default (...components) => {
  if (components.length === 1) { return tachyoned(_.first(components)); }
  return components.map(tachyoned);
};
