/* @flow */
'use strict';

import React, {View, Text, Dimensions} from 'react-native-desktop';

import GL from 'gl-react-native';
import shaders, {lightShaderText} from './shaders';

class RNGLDesktop extends React.Component {
  constructor() {
    super();
    this.state = {
      time: 0
    }
  }
  componentDidMount() {
    this.play();
  }
  play() {
    const loop = t => {
      this.setState({ time: this.state.time + 0.01});
      requestAnimationFrame(loop);
    };
    loop();
  }
  render() {
    const { width, height } = Dimensions.get('window');
    return (
        <View style={{flex: 1}}>
          <GL.View
            shader={shaders.light}
            opaque={true}
            width={width}
            height={height}
            uniforms={{
              time: this.state.time,
              resolution: [width, height]
            }}
          />
          <View style={{position: 'absolute', top: 50, left: 100, flex: 1, backgroundColor: 'transparent'}}>
            <Text style={{fontFamily: 'Monaco', color: '#ccc', fontSize: 10}}>{lightShaderText}</Text>
          </View>
        </View>
    );
    // <GL.View
    //   shader={shaders.light}
    //   opaque={true}
    //   width={width}
    //   height={height}
    //   uniforms={{
    //     time: this.state.time,
    //     resolution: [width, height]
    //   }}
    // />
  }
}

const styles = {
  textWrapper: {

  }
}
React.AppRegistry.registerComponent('RNGLDesktop', () => RNGLDesktop);
