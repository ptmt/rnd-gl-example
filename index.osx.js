/* @flow */
'use strict';

import React, {View, Text, Dimensions} from 'react-native-desktop';

import GL from 'gl-react';
import { Surface } from "gl-react-native";

import shaders, {lightShaderText} from './shaders';

const HelloWorld = GL.createComponent(({time, resolution}) =>
  <GL.Node shader={shaders.light} uniforms={{ time, resolution }}/>,
  { displayName: "HelloGL" }
);

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
          <Surface
            width={width}
            height={height}
            opaque={false}
          >
            <HelloWorld
              time= {this.state.time}
              resolution = {[width, height]} />
          </Surface>
          { /* <GL.View
            shader={shaders.light}
            opaque={true}
            width={width}
            height={height}

          /> */}
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
