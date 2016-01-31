const GL = require("gl-react");

const lightShaderText = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2  resolution;
uniform float  time;

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x,resolution.y);

  float radius = 1.0;
  float radiusMovSpeed = 1.3;
  float speed = 0.3;
  float timeSpeedDiff = 0.11;
  float circleSize = 0.03;
  float distanceDiff = 0.1;

  vec3 colorDest = vec3(1.0,1.0,0.0);
  for(float i = 0.0;i < 19.0; i++)
  {
    float j = i + 1.0;
    vec2 q = p + vec2((radius*cos(time*radiusMovSpeed))*cos(time*(speed+timeSpeedDiff*j) + j*distanceDiff),(radius*sin(time*radiusMovSpeed))*sin(time*(speed+timeSpeedDiff*j) + j*distanceDiff));
    float l = circleSize/length(q);
    colorDest += vec3(l-0.15,l-0.15,l-0.03);
  }
  gl_FragColor = vec4(vec3(colorDest),1.0);
}
`;


const shaders = GL.Shaders.create({
  helloGL: {
    frag: `
    varying vec2 uv;
    uniform vec2 resolution;
    void main () {
      gl_FragColor = vec4(uv.x, uv.y, 0.5, 1.0);
    }`
      },
  light: {
    frag: lightShaderText
  },
  smoke: {
    frag: `
    #ifdef GL_ES
    precision lowp float;
    #endif
    #define LINEAR_DENSITY 0  // 0: constant
    #define H   .05           // skin layer thickness (for linear density)
    #define ANIM true         // true/false
    #define PI 3.14159
    uniform vec2 resolution;
    uniform float time;
    varying vec2 uv;
    // --- noise functions from https://www.shadertoy.com/view/XslGRr
    // Created by inigo quilez - iq/2013
    // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    mat3 m = mat3( 0.00,  0.80,  0.60,
                  -0.80,  0.36, -0.48,
                  -0.60, -0.48,  0.64 );

    float hash( float n )
    {
        return fract(sin(n)*43758.5453);
    }
    float radius() {
      return time / 24.0;
    }
    float density () {
      return time / 24.0 + 0.7;
    }
    float noise( in vec3 x )
    {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        float n = p.x + p.y*57.0 + 113.0*p.z;
        float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                            mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                        mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                            mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
        return res;
    }
    float fbm( vec3 p )
    {
        float f;
        f  = 0.5000*noise( p ); p = m*p*2.02;
        f += 0.2500*noise( p ); p = m*p*2.03;
        f += 0.1250*noise( p ); p = m*p*2.01;
        f += 0.0625*noise( p );
        return f;
    }
    // --- End of: Created by inigo quilez --------------------
    vec3 noise3( vec3 p )
    {
    	if (ANIM) p += time;
        float fx = noise(p);
        float fy = noise(p+vec3(1345.67,0,45.67));
        float fz = noise(p+vec3(0,4567.8,-123.4));
        return vec3(fx,fy,fz);
    }
    vec3 fbm3( vec3 p )
    {
    	if (ANIM) p += time;
        float fx = fbm(p);
        float fy = fbm(p+vec3(1345.67,0,45.67));
        float fz = fbm(p+vec3(0,4567.8,-123.4));
    return vec3(fx,fy,fz);
    }
    vec3 perturb3(vec3 p, float scaleX, float scaleI)
    {
        scaleX *= 2.;
    	return scaleI*scaleX*fbm3(p/scaleX); // usually, to be added to p
    }
    float constantDensityTransmittance(float NDotL,float NDotO)
    {
        return NDotL/(density()*(NDotL+NDotO));
    }
    float linearDensityTransmittance(float NDotL,float NDotO)
    {
       return sqrt(PI/2.) / sqrt(density()/H) ; // test1
    }
    //float Rz=0.;  // 1/2 ray length inside object
    float intersectSphere(vec3 rpos, vec3 rdir, float r)
    {
        vec3 op = vec3(0.0, 0.0, 0.0) - rpos;
        //float rad = 0.3;
        float Rz = 0.;
        float eps = 1e-9;
        float b = dot(op, rdir);
        float det = b*b - dot(op, op) + r*r;
        if (det > 0.0)
        {
            det = sqrt(det);
            float t = b - det;
            if (t > eps)
            {
                vec4 P = vec4(normalize(rpos+rdir*t), t);
                Rz = r*P.z;   // 1/2 ray length inside object
    #if LINEAR_DENSITY
                // skin layer counts less
                float dH = 1.+H*(H-2.*r/Rz*Rz);
                if (dH>0.) // core region
                    Rz *= .5*(1.+sqrt(dH));
                else
                    Rz *= .5*r*(1.-sqrt(1.-Rz*Rz/r*r))/H;
    #endif
                //return P;
            }
        }
        return Rz;
    }
    float computeNormal(in vec3 cameraPos, in vec3 cameraDir, out vec3 normal, float r)
    {
        cameraPos = cameraPos+perturb3(cameraDir,.06,1.5);
        return intersectSphere(cameraPos, cameraDir, r);
    }
    float computeTransmittance( in vec3 cameraPos, in vec3 cameraDir, float r)
    {
        vec3 normal;
        return computeNormal(cameraPos, cameraDir, normal, r);
    }

    void main(void)
    {
      vec4 fragCoord = gl_FragCoord;
      vec3 cameraPos = vec3(0.0,0.0,1.0);
      vec3 cameraTarget = vec3(0.0, 0.0, 0.0);
      vec3 ww = normalize( cameraPos - cameraTarget );
      vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));
      vec3 vv = normalize(cross(ww,uu));
      vec2 q = fragCoord.xy / resolution.xy;
      vec2 p = -1.0 + 2.0 * q;
      p.x *= resolution.x/ resolution.y;
      vec3 cameraDir = normalize( p.x*uu + p.y*vv - 1.5*ww );
      float RzRed = 0.;
      RzRed = computeTransmittance(cameraPos, cameraDir, radius());
      RzRed = 1. - exp(-8. * density() * RzRed);
      float alphaRed = RzRed; //228,44,229
      vec4 colorRed = vec4(1. - alphaRed, 0.1 - alphaRed, 0.9 - alphaRed, alphaRed);
      gl_FragColor = colorRed;

    }
`
  }
});

shaders.lightShaderText = lightShaderText;
module.exports = shaders;
