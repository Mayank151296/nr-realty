( function () {

	/**
 * Full-screen textured quad shader
 */

	const CopyShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'opacity': {
				value: 1.0
			}
		},
		vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
		fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a *= opacity;


		}`
	};

	THREE.CopyShader = CopyShader;

} )();
( function () {

	/**
 * Luminosity
 * http://en.wikipedia.org/wiki/Luminosity
 */

	const LuminosityHighPassShader = {
		shaderID: 'luminosityHighPass',
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'luminosityThreshold': {
				value: 1.0
			},
			'smoothWidth': {
				value: 1.0
			},
			'defaultColor': {
				value: new THREE.Color( 0x000000 )
			},
			'defaultOpacity': {
				value: 0.0
			}
		},
		vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
		fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			vec3 luma = vec3( 0.299, 0.587, 0.114 );

			float v = dot( texel.xyz, luma );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`
	};

	THREE.LuminosityHighPassShader = LuminosityHighPassShader;

} )();
( function () {

	/**
 * NVIDIA FXAA by Timothy Lottes
 * https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
 * - WebGL port by @supereggbert
 * http://www.glge.org/demos/fxaa/
 * Further improved by Daniel Sturk
 */

	const FXAAShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'resolution': {
				value: new THREE.Vector2( 1 / 1024, 1 / 512 )
			}
		},
		vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
		fragmentShader: `
	precision highp float;

	uniform sampler2D tDiffuse;

	uniform vec2 resolution;

	varying vec2 vUv;

	// FXAA 3.11 implementation by NVIDIA, ported to WebGL by Agost Biro (biro@archilogic.com)

	//----------------------------------------------------------------------------------
	// File:        es3-kepler\FXAA\assets\shaders/FXAA_DefaultES.frag
	// SDK Version: v3.00
	// Email:       gameworks@nvidia.com
	// Site:        http://developer.nvidia.com/
	//
	// Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved.
	//
	// Redistribution and use in source and binary forms, with or without
	// modification, are permitted provided that the following conditions
	// are met:
	//  * Redistributions of source code must retain the above copyright
	//    notice, this list of conditions and the following disclaimer.
	//  * Redistributions in binary form must reproduce the above copyright
	//    notice, this list of conditions and the following disclaimer in the
	//    documentation and/or other materials provided with the distribution.
	//  * Neither the name of NVIDIA CORPORATION nor the names of its
	//    contributors may be used to endorse or promote products derived
	//    from this software without specific prior written permission.
	//
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ''AS IS'' AND ANY
	// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
	// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
	// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
	// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
	// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	//
	//----------------------------------------------------------------------------------

	#ifndef FXAA_DISCARD
			//
			// Only valid for PC OpenGL currently.
			// Probably will not work when FXAA_GREEN_AS_LUMA = 1.
			//
			// 1 = Use discard on pixels which don't need AA.
			//     For APIs which enable concurrent TEX+ROP from same surface.
			// 0 = Return unchanged color on pixels which don't need AA.
			//
			#define FXAA_DISCARD 0
	#endif

	/*--------------------------------------------------------------------------*/
	#define FxaaTexTop(t, p) texture2D(t, p, -100.0)
	#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), -100.0)
	/*--------------------------------------------------------------------------*/

	#define NUM_SAMPLES 5

	// assumes colors have premultipliedAlpha, so that the calculated color contrast is scaled by alpha
	float contrast( vec4 a, vec4 b ) {
			vec4 diff = abs( a - b );
			return max( max( max( diff.r, diff.g ), diff.b ), diff.a );
	}

	/*============================================================================

									FXAA3 QUALITY - PC

	============================================================================*/

	/*--------------------------------------------------------------------------*/
	vec4 FxaaPixelShader(
			vec2 posM,
			sampler2D tex,
			vec2 fxaaQualityRcpFrame,
			float fxaaQualityEdgeThreshold,
			float fxaaQualityinvEdgeThreshold
	) {
			vec4 rgbaM = FxaaTexTop(tex, posM);
			vec4 rgbaS = FxaaTexOff(tex, posM, vec2( 0.0, 1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaE = FxaaTexOff(tex, posM, vec2( 1.0, 0.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaN = FxaaTexOff(tex, posM, vec2( 0.0,-1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaW = FxaaTexOff(tex, posM, vec2(-1.0, 0.0), fxaaQualityRcpFrame.xy);
			// . S .
			// W M E
			// . N .

			bool earlyExit = max( max( max(
					contrast( rgbaM, rgbaN ),
					contrast( rgbaM, rgbaS ) ),
					contrast( rgbaM, rgbaE ) ),
					contrast( rgbaM, rgbaW ) )
					< fxaaQualityEdgeThreshold;
			// . 0 .
			// 0 0 0
			// . 0 .

			#if (FXAA_DISCARD == 1)
					if(earlyExit) FxaaDiscard;
			#else
					if(earlyExit) return rgbaM;
			#endif

			float contrastN = contrast( rgbaM, rgbaN );
			float contrastS = contrast( rgbaM, rgbaS );
			float contrastE = contrast( rgbaM, rgbaE );
			float contrastW = contrast( rgbaM, rgbaW );

			float relativeVContrast = ( contrastN + contrastS ) - ( contrastE + contrastW );
			relativeVContrast *= fxaaQualityinvEdgeThreshold;

			bool horzSpan = relativeVContrast > 0.;
			// . 1 .
			// 0 0 0
			// . 1 .

			// 45 deg edge detection and corners of objects, aka V/H contrast is too similar
			if( abs( relativeVContrast ) < .3 ) {
					// locate the edge
					vec2 dirToEdge;
					dirToEdge.x = contrastE > contrastW ? 1. : -1.;
					dirToEdge.y = contrastS > contrastN ? 1. : -1.;
					// . 2 .      . 1 .
					// 1 0 2  ~=  0 0 1
					// . 1 .      . 0 .

					// tap 2 pixels and see which ones are "outside" the edge, to
					// determine if the edge is vertical or horizontal

					vec4 rgbaAlongH = FxaaTexOff(tex, posM, vec2( dirToEdge.x, -dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongH = contrast( rgbaM, rgbaAlongH );
					// . 1 .
					// 0 0 1
					// . 0 H

					vec4 rgbaAlongV = FxaaTexOff(tex, posM, vec2( -dirToEdge.x, dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongV = contrast( rgbaM, rgbaAlongV );
					// V 1 .
					// 0 0 1
					// . 0 .

					relativeVContrast = matchAlongV - matchAlongH;
					relativeVContrast *= fxaaQualityinvEdgeThreshold;

					if( abs( relativeVContrast ) < .3 ) { // 45 deg edge
							// 1 1 .
							// 0 0 1
							// . 0 1

							// do a simple blur
							return mix(
									rgbaM,
									(rgbaN + rgbaS + rgbaE + rgbaW) * .25,
									.4
							);
					}

					horzSpan = relativeVContrast > 0.;
			}

			if(!horzSpan) rgbaN = rgbaW;
			if(!horzSpan) rgbaS = rgbaE;
			// . 0 .      1
			// 1 0 1  ->  0
			// . 0 .      1

			bool pairN = contrast( rgbaM, rgbaN ) > contrast( rgbaM, rgbaS );
			if(!pairN) rgbaN = rgbaS;

			vec2 offNP;
			offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
			offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;

			bool doneN = false;
			bool doneP = false;

			float nDist = 0.;
			float pDist = 0.;

			vec2 posN = posM;
			vec2 posP = posM;

			int iterationsUsed = 0;
			int iterationsUsedN = 0;
			int iterationsUsedP = 0;
			for( int i = 0; i < NUM_SAMPLES; i++ ) {
					iterationsUsed = i;

					float increment = float(i + 1);

					if(!doneN) {
							nDist += increment;
							posN = posM + offNP * nDist;
							vec4 rgbaEndN = FxaaTexTop(tex, posN.xy);
							doneN = contrast( rgbaEndN, rgbaM ) > contrast( rgbaEndN, rgbaN );
							iterationsUsedN = i;
					}

					if(!doneP) {
							pDist += increment;
							posP = posM - offNP * pDist;
							vec4 rgbaEndP = FxaaTexTop(tex, posP.xy);
							doneP = contrast( rgbaEndP, rgbaM ) > contrast( rgbaEndP, rgbaN );
							iterationsUsedP = i;
					}

					if(doneN || doneP) break;
			}


			if ( !doneP && !doneN ) return rgbaM; // failed to find end of edge

			float dist = min(
					doneN ? float( iterationsUsedN ) / float( NUM_SAMPLES - 1 ) : 1.,
					doneP ? float( iterationsUsedP ) / float( NUM_SAMPLES - 1 ) : 1.
			);

			// hacky way of reduces blurriness of mostly diagonal edges
			// but reduces AA quality
			dist = pow(dist, .5);

			dist = 1. - dist;

			return mix(
					rgbaM,
					rgbaN,
					dist * .5
			);
	}

	void main() {
			const float edgeDetectionQuality = .2;
			const float invEdgeDetectionQuality = 1. / edgeDetectionQuality;

			gl_FragColor = FxaaPixelShader(
					vUv,
					tDiffuse,
					resolution,
					edgeDetectionQuality, // [0,1] contrast needed, otherwise early discard
					invEdgeDetectionQuality
			);

	}
	`
	};

	THREE.FXAAShader = FXAAShader;

} )();
( function () {

	/**
 * TODO
 */

	const SAOShader = {
		defines: {
			'NUM_SAMPLES': 7,
			'NUM_RINGS': 4,
			'NORMAL_TEXTURE': 0,
			'DIFFUSE_TEXTURE': 0,
			'DEPTH_PACKING': 1,
			'PERSPECTIVE_CAMERA': 1
		},
		uniforms: {
			'tDepth': {
				value: null
			},
			'tDiffuse': {
				value: null
			},
			'tNormal': {
				value: null
			},
			'size': {
				value: new THREE.Vector2( 512, 512 )
			},
			'cameraNear': {
				value: 1
			},
			'cameraFar': {
				value: 100
			},
			'cameraProjectionMatrix': {
				value: new THREE.Matrix4()
			},
			'cameraInverseProjectionMatrix': {
				value: new THREE.Matrix4()
			},
			'scale': {
				value: 1.0
			},
			'intensity': {
				value: 0.1
			},
			'bias': {
				value: 0.5
			},
			'minResolution': {
				value: 0.0
			},
			'kernelRadius': {
				value: 100.0
			},
			'randomSeed': {
				value: 0.0
			}
		},
		vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader: /* glsl */`

		#include <common>

		varying vec2 vUv;

		#if DIFFUSE_TEXTURE == 1
		uniform sampler2D tDiffuse;
		#endif

		uniform sampler2D tDepth;

		#if NORMAL_TEXTURE == 1
		uniform sampler2D tNormal;
		#endif

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;

		uniform float scale;
		uniform float intensity;
		uniform float bias;
		uniform float kernelRadius;
		uniform float minResolution;
		uniform vec2 size;
		uniform float randomSeed;

		// RGBA depth

		#include <packing>

		vec4 getDefaultColor( const in vec2 screenPosition ) {
			#if DIFFUSE_TEXTURE == 1
			return texture2D( tDiffuse, vUv );
			#else
			return vec4( 1.0 );
			#endif
		}

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			#else
			return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			#endif
		}

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
			vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
			clipPosition *= clipW; // unprojection.

			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
		}

		vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {
			#if NORMAL_TEXTURE == 1
			return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
			#else
			return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );
			#endif
		}

		float scaleDividedByCameraFar;
		float minResolutionMultipliedByCameraFar;

		float getOcclusion( const in vec3 centerViewPosition, const in vec3 centerViewNormal, const in vec3 sampleViewPosition ) {
			vec3 viewDelta = sampleViewPosition - centerViewPosition;
			float viewDistance = length( viewDelta );
			float scaledScreenDistance = scaleDividedByCameraFar * viewDistance;

			return max(0.0, (dot(centerViewNormal, viewDelta) - minResolutionMultipliedByCameraFar) / scaledScreenDistance - bias) / (1.0 + pow2( scaledScreenDistance ) );
		}

		// moving costly divides into consts
		const float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
		const float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

		float getAmbientOcclusion( const in vec3 centerViewPosition ) {
			// precompute some variables require in getOcclusion.
			scaleDividedByCameraFar = scale / cameraFar;
			minResolutionMultipliedByCameraFar = minResolution * cameraFar;
			vec3 centerViewNormal = getViewNormal( centerViewPosition, vUv );

			// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
			float angle = rand( vUv + randomSeed ) * PI2;
			vec2 radius = vec2( kernelRadius * INV_NUM_SAMPLES ) / size;
			vec2 radiusStep = radius;

			float occlusionSum = 0.0;
			float weightSum = 0.0;

			for( int i = 0; i < NUM_SAMPLES; i ++ ) {
				vec2 sampleUv = vUv + vec2( cos( angle ), sin( angle ) ) * radius;
				radius += radiusStep;
				angle += ANGLE_STEP;

				float sampleDepth = getDepth( sampleUv );
				if( sampleDepth >= ( 1.0 - EPSILON ) ) {
					continue;
				}

				float sampleViewZ = getViewZ( sampleDepth );
				vec3 sampleViewPosition = getViewPosition( sampleUv, sampleDepth, sampleViewZ );
				occlusionSum += getOcclusion( centerViewPosition, centerViewNormal, sampleViewPosition );
				weightSum += 1.0;
			}

			if( weightSum == 0.0 ) discard;

			return occlusionSum * ( intensity / weightSum );
		}

		void main() {
			float centerDepth = getDepth( vUv );
			if( centerDepth >= ( 1.0 - EPSILON ) ) {
				discard;
			}

			float centerViewZ = getViewZ( centerDepth );
			vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );

			float ambientOcclusion = getAmbientOcclusion( viewPosition );

			gl_FragColor = getDefaultColor( vUv );
			gl_FragColor.xyz *=  1.0 - ambientOcclusion;
		}`
	};

	THREE.SAOShader = SAOShader;

} )();
( function () {

	/**
 * TODO
 */

	const DepthLimitedBlurShader = {
		defines: {
			'KERNEL_RADIUS': 4,
			'DEPTH_PACKING': 1,
			'PERSPECTIVE_CAMERA': 1
		},
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'size': {
				value: new THREE.Vector2( 512, 512 )
			},
			'sampleUvOffsets': {
				value: [ new THREE.Vector2( 0, 0 ) ]
			},
			'sampleWeights': {
				value: [ 1.0 ]
			},
			'tDepth': {
				value: null
			},
			'cameraNear': {
				value: 10
			},
			'cameraFar': {
				value: 1000
			},
			'depthCutoff': {
				value: 10
			}
		},
		vertexShader: /* glsl */`

		#include <common>

		uniform vec2 size;

		varying vec2 vUv;
		varying vec2 vInvSize;

		void main() {
			vUv = uv;
			vInvSize = 1.0 / size;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
		fragmentShader: /* glsl */`

		#include <common>
		#include <packing>

		uniform sampler2D tDiffuse;
		uniform sampler2D tDepth;

		uniform float cameraNear;
		uniform float cameraFar;
		uniform float depthCutoff;

		uniform vec2 sampleUvOffsets[ KERNEL_RADIUS + 1 ];
		uniform float sampleWeights[ KERNEL_RADIUS + 1 ];

		varying vec2 vUv;
		varying vec2 vInvSize;

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
			#else
			return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
			#endif
		}

		void main() {
			float depth = getDepth( vUv );
			if( depth >= ( 1.0 - EPSILON ) ) {
				discard;
			}

			float centerViewZ = -getViewZ( depth );
			bool rBreak = false, lBreak = false;

			float weightSum = sampleWeights[0];
			vec4 diffuseSum = texture2D( tDiffuse, vUv ) * weightSum;

			for( int i = 1; i <= KERNEL_RADIUS; i ++ ) {

				float sampleWeight = sampleWeights[i];
				vec2 sampleUvOffset = sampleUvOffsets[i] * vInvSize;

				vec2 sampleUv = vUv + sampleUvOffset;
				float viewZ = -getViewZ( getDepth( sampleUv ) );

				if( abs( viewZ - centerViewZ ) > depthCutoff ) rBreak = true;

				if( ! rBreak ) {
					diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;
					weightSum += sampleWeight;
				}

				sampleUv = vUv - sampleUvOffset;
				viewZ = -getViewZ( getDepth( sampleUv ) );

				if( abs( viewZ - centerViewZ ) > depthCutoff ) lBreak = true;

				if( ! lBreak ) {
					diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;
					weightSum += sampleWeight;
				}

			}

			gl_FragColor = diffuseSum / weightSum;
		}`
	};
	const BlurShaderUtils = {
		createSampleWeights: function ( kernelRadius, stdDev ) {

			const weights = [];
			for ( let i = 0; i <= kernelRadius; i ++ ) {

				weights.push( gaussian( i, stdDev ) );

			}

			return weights;

		},
		createSampleOffsets: function ( kernelRadius, uvIncrement ) {

			const offsets = [];
			for ( let i = 0; i <= kernelRadius; i ++ ) {

				offsets.push( uvIncrement.clone().multiplyScalar( i ) );

			}

			return offsets;

		},
		configure: function ( material, kernelRadius, stdDev, uvIncrement ) {

			material.defines[ 'KERNEL_RADIUS' ] = kernelRadius;
			material.uniforms[ 'sampleUvOffsets' ].value = BlurShaderUtils.createSampleOffsets( kernelRadius, uvIncrement );
			material.uniforms[ 'sampleWeights' ].value = BlurShaderUtils.createSampleWeights( kernelRadius, stdDev );
			material.needsUpdate = true;

		}
	};
	function gaussian( x, stdDev ) {

		return Math.exp( - ( x * x ) / ( 2.0 * ( stdDev * stdDev ) ) ) / ( Math.sqrt( 2.0 * Math.PI ) * stdDev );

	}

	THREE.BlurShaderUtils = BlurShaderUtils;
	THREE.DepthLimitedBlurShader = DepthLimitedBlurShader;

} )();
( function () {

	/**
 * Unpack RGBA depth shader
 * - show RGBA encoded depth as monochrome color
 */

	const UnpackDepthRGBAShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'opacity': {
				value: 1.0
			}
		},
		vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
		fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		#include <packing>

		void main() {

			float depth = 1.0 - unpackRGBAToDepth( texture2D( tDiffuse, vUv ) );
			gl_FragColor = vec4( vec3( depth ), opacity );

		}`
	};

	THREE.UnpackDepthRGBAShader = UnpackDepthRGBAShader;

} )();
( function () {

	class Pass {

		constructor() {

			// if set to true, the pass is processed by the composer
			this.enabled = true;

			// if set to true, the pass indicates to swap read and write buffer after rendering
			this.needsSwap = true;

			// if set to true, the pass clears its buffer before rendering
			this.clear = false;

			// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
			this.renderToScreen = false;

		}
		setSize() {}
		render() {

			console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

		}
		dispose() {}

	}

	// Helper for passes that need to fill the viewport with a single quad.

	const _camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

	// https://github.com/mrdoob/three.js/pull/21358

	const _geometry = new THREE.BufferGeometry();
	_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
	_geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );
	class FullScreenQuad {

		constructor( material ) {

			this._mesh = new THREE.Mesh( _geometry, material );

		}
		dispose() {

			this._mesh.geometry.dispose();

		}
		render( renderer ) {

			renderer.render( this._mesh, _camera );

		}
		get material() {

			return this._mesh.material;

		}
		set material( value ) {

			this._mesh.material = value;

		}

	}

	THREE.FullScreenQuad = FullScreenQuad;
	THREE.Pass = Pass;

} )();
( function () {

	class MaskPass extends THREE.Pass {

		constructor( scene, camera ) {

			super();
			this.scene = scene;
			this.camera = camera;
			this.clear = true;
			this.needsSwap = false;
			this.inverse = false;

		}
		render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

			const context = renderer.getContext();
			const state = renderer.state;

			// don't update color or depth

			state.buffers.color.setMask( false );
			state.buffers.depth.setMask( false );

			// lock buffers

			state.buffers.color.setLocked( true );
			state.buffers.depth.setLocked( true );

			// set up stencil

			let writeValue, clearValue;
			if ( this.inverse ) {

				writeValue = 0;
				clearValue = 1;

			} else {

				writeValue = 1;
				clearValue = 0;

			}

			state.buffers.stencil.setTest( true );
			state.buffers.stencil.setOp( context.REPLACE, context.REPLACE, context.REPLACE );
			state.buffers.stencil.setFunc( context.ALWAYS, writeValue, 0xffffffff );
			state.buffers.stencil.setClear( clearValue );
			state.buffers.stencil.setLocked( true );

			// draw into the stencil buffer

			renderer.setRenderTarget( readBuffer );
			if ( this.clear ) renderer.clear();
			renderer.render( this.scene, this.camera );
			renderer.setRenderTarget( writeBuffer );
			if ( this.clear ) renderer.clear();
			renderer.render( this.scene, this.camera );

			// unlock color and depth buffer for subsequent rendering

			state.buffers.color.setLocked( false );
			state.buffers.depth.setLocked( false );

			// only render where stencil is set to 1

			state.buffers.stencil.setLocked( false );
			state.buffers.stencil.setFunc( context.EQUAL, 1, 0xffffffff ); // draw if == 1
			state.buffers.stencil.setOp( context.KEEP, context.KEEP, context.KEEP );
			state.buffers.stencil.setLocked( true );

		}

	}
	class ClearMaskPass extends THREE.Pass {

		constructor() {

			super();
			this.needsSwap = false;

		}
		render( renderer /*, writeBuffer, readBuffer, deltaTime, maskActive */ ) {

			renderer.state.buffers.stencil.setLocked( false );
			renderer.state.buffers.stencil.setTest( false );

		}

	}

	THREE.ClearMaskPass = ClearMaskPass;
	THREE.MaskPass = MaskPass;

} )();
( function () {

	class EffectComposer {

		constructor( renderer, renderTarget ) {

			this.renderer = renderer;
			if ( renderTarget === undefined ) {

				const size = renderer.getSize( new THREE.Vector2() );
				this._pixelRatio = renderer.getPixelRatio();
				this._width = size.width;
				this._height = size.height;
				renderTarget = new THREE.WebGLRenderTarget( this._width * this._pixelRatio, this._height * this._pixelRatio );
				renderTarget.texture.name = 'EffectComposer.rt1';

			} else {

				this._pixelRatio = 1;
				this._width = renderTarget.width;
				this._height = renderTarget.height;

			}

			this.renderTarget1 = renderTarget;
			this.renderTarget2 = renderTarget.clone();
			this.renderTarget2.texture.name = 'EffectComposer.rt2';
			this.writeBuffer = this.renderTarget1;
			this.readBuffer = this.renderTarget2;
			this.renderToScreen = true;
			this.passes = [];

			// dependencies

			if ( THREE.CopyShader === undefined ) {

				console.error( 'THREE.EffectComposer relies on THREE.CopyShader' );

			}

			if ( THREE.ShaderPass === undefined ) {

				console.error( 'THREE.EffectComposer relies on THREE.ShaderPass' );

			}

			this.copyPass = new THREE.ShaderPass( THREE.CopyShader );
			this.clock = new THREE.Clock();

		}
		swapBuffers() {

			const tmp = this.readBuffer;
			this.readBuffer = this.writeBuffer;
			this.writeBuffer = tmp;

		}
		addPass( pass ) {

			this.passes.push( pass );
			pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

		}
		insertPass( pass, index ) {

			this.passes.splice( index, 0, pass );
			pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

		}
		removePass( pass ) {

			const index = this.passes.indexOf( pass );
			if ( index !== - 1 ) {

				this.passes.splice( index, 1 );

			}

		}
		isLastEnabledPass( passIndex ) {

			for ( let i = passIndex + 1; i < this.passes.length; i ++ ) {

				if ( this.passes[ i ].enabled ) {

					return false;

				}

			}

			return true;

		}
		render( deltaTime ) {

			// deltaTime value is in seconds

			if ( deltaTime === undefined ) {

				deltaTime = this.clock.getDelta();

			}

			const currentRenderTarget = this.renderer.getRenderTarget();
			let maskActive = false;
			for ( let i = 0, il = this.passes.length; i < il; i ++ ) {

				const pass = this.passes[ i ];
				if ( pass.enabled === false ) continue;
				pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass( i );
				pass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive );
				if ( pass.needsSwap ) {

					if ( maskActive ) {

						const context = this.renderer.getContext();
						const stencil = this.renderer.state.buffers.stencil;

						//context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
						stencil.setFunc( context.NOTEQUAL, 1, 0xffffffff );
						this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime );

						//context.stencilFunc( context.EQUAL, 1, 0xffffffff );
						stencil.setFunc( context.EQUAL, 1, 0xffffffff );

					}

					this.swapBuffers();

				}

				if ( THREE.MaskPass !== undefined ) {

					if ( pass instanceof THREE.MaskPass ) {

						maskActive = true;

					} else if ( pass instanceof THREE.ClearMaskPass ) {

						maskActive = false;

					}

				}

			}

			this.renderer.setRenderTarget( currentRenderTarget );

		}
		reset( renderTarget ) {

			if ( renderTarget === undefined ) {

				const size = this.renderer.getSize( new THREE.Vector2() );
				this._pixelRatio = this.renderer.getPixelRatio();
				this._width = size.width;
				this._height = size.height;
				renderTarget = this.renderTarget1.clone();
				renderTarget.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

			}

			this.renderTarget1.dispose();
			this.renderTarget2.dispose();
			this.renderTarget1 = renderTarget;
			this.renderTarget2 = renderTarget.clone();
			this.writeBuffer = this.renderTarget1;
			this.readBuffer = this.renderTarget2;

		}
		setSize( width, height ) {

			this._width = width;
			this._height = height;
			const effectiveWidth = this._width * this._pixelRatio;
			const effectiveHeight = this._height * this._pixelRatio;
			this.renderTarget1.setSize( effectiveWidth, effectiveHeight );
			this.renderTarget2.setSize( effectiveWidth, effectiveHeight );
			for ( let i = 0; i < this.passes.length; i ++ ) {

				this.passes[ i ].setSize( effectiveWidth, effectiveHeight );

			}

		}
		setPixelRatio( pixelRatio ) {

			this._pixelRatio = pixelRatio;
			this.setSize( this._width, this._height );

		}
		dispose() {

			this.renderTarget1.dispose();
			this.renderTarget2.dispose();
			this.copyPass.dispose();

		}

	}
	class Pass {

		constructor() {

			// if set to true, the pass is processed by the composer
			this.enabled = true;

			// if set to true, the pass indicates to swap read and write buffer after rendering
			this.needsSwap = true;

			// if set to true, the pass clears its buffer before rendering
			this.clear = false;

			// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
			this.renderToScreen = false;

		}
		setSize() {}
		render() {

			console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

		}

	}

	// Helper for passes that need to fill the viewport with a single quad.

	const _camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

	// https://github.com/mrdoob/three.js/pull/21358

	const _geometry = new THREE.BufferGeometry();
	_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
	_geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );
	class FullScreenQuad {

		constructor( material ) {

			this._mesh = new THREE.Mesh( _geometry, material );

		}
		dispose() {

			this._mesh.geometry.dispose();

		}
		render( renderer ) {

			renderer.render( this._mesh, _camera );

		}
		get material() {

			return this._mesh.material;

		}
		set material( value ) {

			this._mesh.material = value;

		}

	}

	THREE.EffectComposer = EffectComposer;
	THREE.FullScreenQuad = FullScreenQuad;
	THREE.Pass = Pass;

} )();
( function () {

	class RenderPass extends THREE.Pass {

		constructor( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

			super();
			this.scene = scene;
			this.camera = camera;
			this.overrideMaterial = overrideMaterial;
			this.clearColor = clearColor;
			this.clearAlpha = clearAlpha !== undefined ? clearAlpha : 0;
			this.clear = true;
			this.clearDepth = false;
			this.needsSwap = false;
			this._oldClearColor = new THREE.Color();

		}
		render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			let oldClearAlpha, oldOverrideMaterial;
			if ( this.overrideMaterial !== undefined ) {

				oldOverrideMaterial = this.scene.overrideMaterial;
				this.scene.overrideMaterial = this.overrideMaterial;

			}

			if ( this.clearColor ) {

				renderer.getClearColor( this._oldClearColor );
				oldClearAlpha = renderer.getClearAlpha();
				renderer.setClearColor( this.clearColor, this.clearAlpha );

			}

			if ( this.clearDepth ) {

				renderer.clearDepth();

			}

			renderer.setRenderTarget( this.renderToScreen ? null : readBuffer );

			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			renderer.render( this.scene, this.camera );
			if ( this.clearColor ) {

				renderer.setClearColor( this._oldClearColor, oldClearAlpha );

			}

			if ( this.overrideMaterial !== undefined ) {

				this.scene.overrideMaterial = oldOverrideMaterial;

			}

			renderer.autoClear = oldAutoClear;

		}

	}

	THREE.RenderPass = RenderPass;

} )();
( function () {

	class ShaderPass extends THREE.Pass {

		constructor( shader, textureID ) {

			super();
			this.textureID = textureID !== undefined ? textureID : 'tDiffuse';
			if ( shader instanceof THREE.ShaderMaterial ) {

				this.uniforms = shader.uniforms;
				this.material = shader;

			} else if ( shader ) {

				this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
				this.material = new THREE.ShaderMaterial( {
					defines: Object.assign( {}, shader.defines ),
					uniforms: this.uniforms,
					vertexShader: shader.vertexShader,
					fragmentShader: shader.fragmentShader
				} );

			}

			this.fsQuad = new THREE.FullScreenQuad( this.material );

		}
		render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

			if ( this.uniforms[ this.textureID ] ) {

				this.uniforms[ this.textureID ].value = readBuffer.texture;

			}

			this.fsQuad.material = this.material;
			if ( this.renderToScreen ) {

				renderer.setRenderTarget( null );
				this.fsQuad.render( renderer );

			} else {

				renderer.setRenderTarget( writeBuffer );
				// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
				if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
				this.fsQuad.render( renderer );

			}

		}
		dispose() {

			this.material.dispose();
			this.fsQuad.dispose();

		}

	}

	THREE.ShaderPass = ShaderPass;

} )();
( function () {

	/**
 * UnrealBloomPass is inspired by the bloom pass of Unreal Engine. It creates a
 * mip map chain of bloom textures and blurs them with different radii. Because
 * of the weighted combination of mips, and because larger blurs are done on
 * higher mips, this effect provides good quality and performance.
 *
 * Reference:
 * - https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */
	class UnrealBloomPass extends THREE.Pass {

		constructor( resolution, strength, radius, threshold ) {

			super();
			this.strength = strength !== undefined ? strength : 1;
			this.radius = radius;
			this.threshold = threshold;
			this.resolution = resolution !== undefined ? new THREE.Vector2( resolution.x, resolution.y ) : new THREE.Vector2( 256, 256 );

			// create color only once here, reuse it later inside the render function
			this.clearColor = new THREE.Color( 0, 0, 0 );

			// render targets
			this.renderTargetsHorizontal = [];
			this.renderTargetsVertical = [];
			this.nMips = 5;
			let resx = Math.round( this.resolution.x / 2 );
			let resy = Math.round( this.resolution.y / 2 );
			this.renderTargetBright = new THREE.WebGLRenderTarget( resx, resy );
			this.renderTargetBright.texture.name = 'UnrealBloomPass.bright';
			this.renderTargetBright.texture.generateMipmaps = false;
			for ( let i = 0; i < this.nMips; i ++ ) {

				const renderTargetHorizonal = new THREE.WebGLRenderTarget( resx, resy );
				renderTargetHorizonal.texture.name = 'UnrealBloomPass.h' + i;
				renderTargetHorizonal.texture.generateMipmaps = false;
				this.renderTargetsHorizontal.push( renderTargetHorizonal );
				const renderTargetVertical = new THREE.WebGLRenderTarget( resx, resy );
				renderTargetVertical.texture.name = 'UnrealBloomPass.v' + i;
				renderTargetVertical.texture.generateMipmaps = false;
				this.renderTargetsVertical.push( renderTargetVertical );
				resx = Math.round( resx / 2 );
				resy = Math.round( resy / 2 );

			}

			// luminosity high pass material

			if ( THREE.LuminosityHighPassShader === undefined ) console.error( 'THREE.UnrealBloomPass relies on THREE.LuminosityHighPassShader' );
			const highPassShader = THREE.LuminosityHighPassShader;
			this.highPassUniforms = THREE.UniformsUtils.clone( highPassShader.uniforms );
			this.highPassUniforms[ 'luminosityThreshold' ].value = threshold;
			this.highPassUniforms[ 'smoothWidth' ].value = 0.01;
			this.materialHighPassFilter = new THREE.ShaderMaterial( {
				uniforms: this.highPassUniforms,
				vertexShader: highPassShader.vertexShader,
				fragmentShader: highPassShader.fragmentShader,
				defines: {}
			} );

			// Gaussian Blur Materials
			this.separableBlurMaterials = [];
			const kernelSizeArray = [ 3, 5, 7, 9, 11 ];
			resx = Math.round( this.resolution.x / 2 );
			resy = Math.round( this.resolution.y / 2 );
			for ( let i = 0; i < this.nMips; i ++ ) {

				this.separableBlurMaterials.push( this.getSeperableBlurMaterial( kernelSizeArray[ i ] ) );
				this.separableBlurMaterials[ i ].uniforms[ 'texSize' ].value = new THREE.Vector2( resx, resy );
				resx = Math.round( resx / 2 );
				resy = Math.round( resy / 2 );

			}

			// Composite material
			this.compositeMaterial = this.getCompositeMaterial( this.nMips );
			this.compositeMaterial.uniforms[ 'blurTexture1' ].value = this.renderTargetsVertical[ 0 ].texture;
			this.compositeMaterial.uniforms[ 'blurTexture2' ].value = this.renderTargetsVertical[ 1 ].texture;
			this.compositeMaterial.uniforms[ 'blurTexture3' ].value = this.renderTargetsVertical[ 2 ].texture;
			this.compositeMaterial.uniforms[ 'blurTexture4' ].value = this.renderTargetsVertical[ 3 ].texture;
			this.compositeMaterial.uniforms[ 'blurTexture5' ].value = this.renderTargetsVertical[ 4 ].texture;
			this.compositeMaterial.uniforms[ 'bloomStrength' ].value = strength;
			this.compositeMaterial.uniforms[ 'bloomRadius' ].value = 0.1;
			this.compositeMaterial.needsUpdate = true;
			const bloomFactors = [ 1.0, 0.8, 0.6, 0.4, 0.2 ];
			this.compositeMaterial.uniforms[ 'bloomFactors' ].value = bloomFactors;
			this.bloomTintColors = [ new THREE.Vector3( 1, 1, 1 ), new THREE.Vector3( 1, 1, 1 ), new THREE.Vector3( 1, 1, 1 ), new THREE.Vector3( 1, 1, 1 ), new THREE.Vector3( 1, 1, 1 ) ];
			this.compositeMaterial.uniforms[ 'bloomTintColors' ].value = this.bloomTintColors;

			// copy material
			if ( THREE.CopyShader === undefined ) {

				console.error( 'THREE.UnrealBloomPass relies on THREE.CopyShader' );

			}

			const copyShader = THREE.CopyShader;
			this.copyUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );
			this.copyUniforms[ 'opacity' ].value = 1.0;
			this.materialCopy = new THREE.ShaderMaterial( {
				uniforms: this.copyUniforms,
				vertexShader: copyShader.vertexShader,
				fragmentShader: copyShader.fragmentShader,
				blending: THREE.AdditiveBlending,
				depthTest: false,
				depthWrite: false,
				transparent: true
			} );
			this.enabled = true;
			this.needsSwap = false;
			this._oldClearColor = new THREE.Color();
			this.oldClearAlpha = 1;
			this.basic = new THREE.MeshBasicMaterial();
			this.fsQuad = new THREE.FullScreenQuad( null );

		}
		dispose() {

			for ( let i = 0; i < this.renderTargetsHorizontal.length; i ++ ) {

				this.renderTargetsHorizontal[ i ].dispose();

			}

			for ( let i = 0; i < this.renderTargetsVertical.length; i ++ ) {

				this.renderTargetsVertical[ i ].dispose();

			}

			this.renderTargetBright.dispose();

			//

			for ( let i = 0; i < this.separableBlurMaterials.length; i ++ ) {

				this.separableBlurMaterials[ i ].dispose();

			}

			this.compositeMaterial.dispose();
			this.materialCopy.dispose();
			this.basic.dispose();

			//

			this.fsQuad.dispose();

		}
		setSize( width, height ) {

			let resx = Math.round( width / 2 );
			let resy = Math.round( height / 2 );
			this.renderTargetBright.setSize( resx, resy );
			for ( let i = 0; i < this.nMips; i ++ ) {

				this.renderTargetsHorizontal[ i ].setSize( resx, resy );
				this.renderTargetsVertical[ i ].setSize( resx, resy );
				this.separableBlurMaterials[ i ].uniforms[ 'texSize' ].value = new THREE.Vector2( resx, resy );
				resx = Math.round( resx / 2 );
				resy = Math.round( resy / 2 );

			}

		}
		render( renderer, writeBuffer, readBuffer, deltaTime, maskActive ) {

			renderer.getClearColor( this._oldClearColor );
			this.oldClearAlpha = renderer.getClearAlpha();
			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			renderer.setClearColor( this.clearColor, 0 );
			if ( maskActive ) renderer.state.buffers.stencil.setTest( false );

			// Render input to screen

			if ( this.renderToScreen ) {

				this.fsQuad.material = this.basic;
				this.basic.map = readBuffer.texture;
				renderer.setRenderTarget( null );
				renderer.clear();
				this.fsQuad.render( renderer );

			}

			// 1. Extract Bright Areas

			this.highPassUniforms[ 'tDiffuse' ].value = readBuffer.texture;
			this.highPassUniforms[ 'luminosityThreshold' ].value = this.threshold;
			this.fsQuad.material = this.materialHighPassFilter;
			renderer.setRenderTarget( this.renderTargetBright );
			renderer.clear();
			this.fsQuad.render( renderer );

			// 2. Blur All the mips progressively

			let inputRenderTarget = this.renderTargetBright;
			for ( let i = 0; i < this.nMips; i ++ ) {

				this.fsQuad.material = this.separableBlurMaterials[ i ];
				this.separableBlurMaterials[ i ].uniforms[ 'colorTexture' ].value = inputRenderTarget.texture;
				this.separableBlurMaterials[ i ].uniforms[ 'direction' ].value = UnrealBloomPass.BlurDirectionX;
				renderer.setRenderTarget( this.renderTargetsHorizontal[ i ] );
				renderer.clear();
				this.fsQuad.render( renderer );
				this.separableBlurMaterials[ i ].uniforms[ 'colorTexture' ].value = this.renderTargetsHorizontal[ i ].texture;
				this.separableBlurMaterials[ i ].uniforms[ 'direction' ].value = UnrealBloomPass.BlurDirectionY;
				renderer.setRenderTarget( this.renderTargetsVertical[ i ] );
				renderer.clear();
				this.fsQuad.render( renderer );
				inputRenderTarget = this.renderTargetsVertical[ i ];

			}

			// Composite All the mips

			this.fsQuad.material = this.compositeMaterial;
			this.compositeMaterial.uniforms[ 'bloomStrength' ].value = this.strength;
			this.compositeMaterial.uniforms[ 'bloomRadius' ].value = this.radius;
			this.compositeMaterial.uniforms[ 'bloomTintColors' ].value = this.bloomTintColors;
			renderer.setRenderTarget( this.renderTargetsHorizontal[ 0 ] );
			renderer.clear();
			this.fsQuad.render( renderer );

			// Blend it additively over the input texture

			this.fsQuad.material = this.materialCopy;
			this.copyUniforms[ 'tDiffuse' ].value = this.renderTargetsHorizontal[ 0 ].texture;
			if ( maskActive ) renderer.state.buffers.stencil.setTest( true );
			if ( this.renderToScreen ) {

				renderer.setRenderTarget( null );
				this.fsQuad.render( renderer );

			} else {

				renderer.setRenderTarget( readBuffer );
				this.fsQuad.render( renderer );

			}

			// Restore renderer settings

			renderer.setClearColor( this._oldClearColor, this.oldClearAlpha );
			renderer.autoClear = oldAutoClear;

		}
		getSeperableBlurMaterial( kernelRadius ) {

			return new THREE.ShaderMaterial( {
				defines: {
					'KERNEL_RADIUS': kernelRadius,
					'SIGMA': kernelRadius
				},
				uniforms: {
					'colorTexture': {
						value: null
					},
					'texSize': {
						value: new THREE.Vector2( 0.5, 0.5 )
					},
					'direction': {
						value: new THREE.Vector2( 0.5, 0.5 )
					}
				},
				vertexShader: `varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,
				fragmentShader: `#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 texSize;
				uniform vec2 direction;

				float gaussianPdf(in float x, in float sigma) {
					return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
				}
				void main() {
					vec2 invSize = 1.0 / texSize;
					float fSigma = float(SIGMA);
					float weightSum = gaussianPdf(0.0, fSigma);
					vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianPdf(x, fSigma);
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`
			} );

		}
		getCompositeMaterial( nMips ) {

			return new THREE.ShaderMaterial( {
				defines: {
					'NUM_MIPS': nMips
				},
				uniforms: {
					'blurTexture1': {
						value: null
					},
					'blurTexture2': {
						value: null
					},
					'blurTexture3': {
						value: null
					},
					'blurTexture4': {
						value: null
					},
					'blurTexture5': {
						value: null
					},
					'bloomStrength': {
						value: 1.0
					},
					'bloomFactors': {
						value: null
					},
					'bloomTintColors': {
						value: null
					},
					'bloomRadius': {
						value: 0.0
					}
				},
				vertexShader: `varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,
				fragmentShader: `varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`
			} );

		}

	}
	UnrealBloomPass.BlurDirectionX = new THREE.Vector2( 1.0, 0.0 );
	UnrealBloomPass.BlurDirectionY = new THREE.Vector2( 0.0, 1.0 );

	THREE.UnrealBloomPass = UnrealBloomPass;

} )();
( function () {

	/**
 * SAO implementation inspired from bhouston previous SAO work
 */

	class SAOPass extends THREE.Pass {

		constructor( scene, camera, useDepthTexture = false, useNormals = false, resolution = new THREE.Vector2( 256, 256 ) ) {

			super();
			this.scene = scene;
			this.camera = camera;
			this.clear = true;
			this.needsSwap = false;
			this.supportsDepthTextureExtension = useDepthTexture;
			this.supportsNormalTexture = useNormals;
			this.originalClearColor = new THREE.Color();
			this._oldClearColor = new THREE.Color();
			this.oldClearAlpha = 1;
			this.params = {
				output: 0,
				saoBias: 0.5,
				saoIntensity: 0.18,
				saoScale: 1,
				saoKernelRadius: 100,
				saoMinResolution: 0,
				saoBlur: true,
				saoBlurRadius: 8,
				saoBlurStdDev: 4,
				saoBlurDepthCutoff: 0.01
			};
			this.resolution = new THREE.Vector2( resolution.x, resolution.y );
			this.saoRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y );
			this.blurIntermediateRenderTarget = this.saoRenderTarget.clone();
			this.beautyRenderTarget = this.saoRenderTarget.clone();
			this.normalRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter
			} );
			this.depthRenderTarget = this.normalRenderTarget.clone();
			let depthTexture;
			if ( this.supportsDepthTextureExtension ) {

				depthTexture = new THREE.DepthTexture();
				depthTexture.type = THREE.UnsignedShortType;
				this.beautyRenderTarget.depthTexture = depthTexture;
				this.beautyRenderTarget.depthBuffer = true;

			}

			this.depthMaterial = new THREE.MeshDepthMaterial();
			this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
			this.depthMaterial.blending = THREE.NoBlending;
			this.normalMaterial = new THREE.MeshNormalMaterial();
			this.normalMaterial.blending = THREE.NoBlending;
			if ( THREE.SAOShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.SAOShader' );

			}

			this.saoMaterial = new THREE.ShaderMaterial( {
				defines: Object.assign( {}, THREE.SAOShader.defines ),
				fragmentShader: THREE.SAOShader.fragmentShader,
				vertexShader: THREE.SAOShader.vertexShader,
				uniforms: THREE.UniformsUtils.clone( THREE.SAOShader.uniforms )
			} );
			this.saoMaterial.extensions.derivatives = true;
			this.saoMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.saoMaterial.defines[ 'NORMAL_TEXTURE' ] = this.supportsNormalTexture ? 1 : 0;
			this.saoMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.saoMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.saoMaterial.uniforms[ 'tNormal' ].value = this.normalRenderTarget.texture;
			this.saoMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );
			this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
			this.saoMaterial.blending = THREE.NoBlending;
			if ( THREE.DepthLimitedBlurShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.DepthLimitedBlurShader' );

			}

			this.vBlurMaterial = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
				defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
				vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
				fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
			} );
			this.vBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.vBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.vBlurMaterial.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
			this.vBlurMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.vBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.vBlurMaterial.blending = THREE.NoBlending;
			this.hBlurMaterial = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
				defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
				vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
				fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
			} );
			this.hBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
			this.hBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
			this.hBlurMaterial.uniforms[ 'tDiffuse' ].value = this.blurIntermediateRenderTarget.texture;
			this.hBlurMaterial.uniforms[ 'tDepth' ].value = this.supportsDepthTextureExtension ? depthTexture : this.depthRenderTarget.texture;
			this.hBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
			this.hBlurMaterial.blending = THREE.NoBlending;
			if ( THREE.CopyShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.CopyShader' );

			}

			this.materialCopy = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.CopyShader.uniforms ),
				vertexShader: THREE.CopyShader.vertexShader,
				fragmentShader: THREE.CopyShader.fragmentShader,
				blending: THREE.NoBlending
			} );
			this.materialCopy.transparent = true;
			this.materialCopy.depthTest = false;
			this.materialCopy.depthWrite = false;
			this.materialCopy.blending = THREE.CustomBlending;
			this.materialCopy.blendSrc = THREE.DstColorFactor;
			this.materialCopy.blendDst = THREE.ZeroFactor;
			this.materialCopy.blendEquation = THREE.AddEquation;
			this.materialCopy.blendSrcAlpha = THREE.DstAlphaFactor;
			this.materialCopy.blendDstAlpha = THREE.ZeroFactor;
			this.materialCopy.blendEquationAlpha = THREE.AddEquation;
			if ( THREE.UnpackDepthRGBAShader === undefined ) {

				console.error( 'THREE.SAOPass relies on THREE.UnpackDepthRGBAShader' );

			}

			this.depthCopy = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( THREE.UnpackDepthRGBAShader.uniforms ),
				vertexShader: THREE.UnpackDepthRGBAShader.vertexShader,
				fragmentShader: THREE.UnpackDepthRGBAShader.fragmentShader,
				blending: THREE.NoBlending
			} );
			this.fsQuad = new THREE.FullScreenQuad( null );

		}
		render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive*/ ) {

			// Rendering readBuffer first when rendering to screen
			if ( this.renderToScreen ) {

				this.materialCopy.blending = THREE.NoBlending;
				this.materialCopy.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
				this.materialCopy.needsUpdate = true;
				this.renderPass( renderer, this.materialCopy, null );

			}

			if ( this.params.output === 1 ) {

				return;

			}

			renderer.getClearColor( this._oldClearColor );
			this.oldClearAlpha = renderer.getClearAlpha();
			const oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;
			renderer.setRenderTarget( this.depthRenderTarget );
			renderer.clear();
			this.saoMaterial.uniforms[ 'bias' ].value = this.params.saoBias;
			this.saoMaterial.uniforms[ 'intensity' ].value = this.params.saoIntensity;
			this.saoMaterial.uniforms[ 'scale' ].value = this.params.saoScale;
			this.saoMaterial.uniforms[ 'kernelRadius' ].value = this.params.saoKernelRadius;
			this.saoMaterial.uniforms[ 'minResolution' ].value = this.params.saoMinResolution;
			this.saoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.saoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
			// this.saoMaterial.uniforms['randomSeed'].value = Math.random();

			const depthCutoff = this.params.saoBlurDepthCutoff * ( this.camera.far - this.camera.near );
			this.vBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;
			this.hBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;
			this.vBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.vBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
			this.hBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
			this.hBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
			this.params.saoBlurRadius = Math.floor( this.params.saoBlurRadius );
			if ( this.prevStdDev !== this.params.saoBlurStdDev || this.prevNumSamples !== this.params.saoBlurRadius ) {

				THREE.BlurShaderUtils.configure( this.vBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 0, 1 ) );
				THREE.BlurShaderUtils.configure( this.hBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 1, 0 ) );
				this.prevStdDev = this.params.saoBlurStdDev;
				this.prevNumSamples = this.params.saoBlurRadius;

			}

			// Rendering scene to depth texture
			renderer.setClearColor( 0x000000 );
			renderer.setRenderTarget( this.beautyRenderTarget );
			renderer.clear();
			renderer.render( this.scene, this.camera );

			// Re-render scene if depth texture extension is not supported
			if ( ! this.supportsDepthTextureExtension ) {

				// Clear rule : far clipping plane in both RGBA and Basic encoding
				this.renderOverride( renderer, this.depthMaterial, this.depthRenderTarget, 0x000000, 1.0 );

			}

			if ( this.supportsNormalTexture ) {

				// Clear rule : default normal is facing the camera
				this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );

			}

			// Rendering SAO texture
			this.renderPass( renderer, this.saoMaterial, this.saoRenderTarget, 0xffffff, 1.0 );

			// Blurring SAO texture
			if ( this.params.saoBlur ) {

				this.renderPass( renderer, this.vBlurMaterial, this.blurIntermediateRenderTarget, 0xffffff, 1.0 );
				this.renderPass( renderer, this.hBlurMaterial, this.saoRenderTarget, 0xffffff, 1.0 );

			}

			let outputMaterial = this.materialCopy;
			// Setting up SAO rendering
			if ( this.params.output === 3 ) {

				if ( this.supportsDepthTextureExtension ) {

					this.materialCopy.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.depthTexture;
					this.materialCopy.needsUpdate = true;

				} else {

					this.depthCopy.uniforms[ 'tDiffuse' ].value = this.depthRenderTarget.texture;
					this.depthCopy.needsUpdate = true;
					outputMaterial = this.depthCopy;

				}

			} else if ( this.params.output === 4 ) {

				this.materialCopy.uniforms[ 'tDiffuse' ].value = this.normalRenderTarget.texture;
				this.materialCopy.needsUpdate = true;

			} else {

				this.materialCopy.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
				this.materialCopy.needsUpdate = true;

			}

			// Blending depends on output, only want a THREE.CustomBlending when showing SAO
			if ( this.params.output === 0 ) {

				outputMaterial.blending = THREE.CustomBlending;

			} else {

				outputMaterial.blending = THREE.NoBlending;

			}

			// Rendering SAOPass result on top of previous pass
			this.renderPass( renderer, outputMaterial, this.renderToScreen ? null : readBuffer );
			renderer.setClearColor( this._oldClearColor, this.oldClearAlpha );
			renderer.autoClear = oldAutoClear;

		}
		renderPass( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

			// save original state
			renderer.getClearColor( this.originalClearColor );
			const originalClearAlpha = renderer.getClearAlpha();
			const originalAutoClear = renderer.autoClear;
			renderer.setRenderTarget( renderTarget );

			// setup pass state
			renderer.autoClear = false;
			if ( clearColor !== undefined && clearColor !== null ) {

				renderer.setClearColor( clearColor );
				renderer.setClearAlpha( clearAlpha || 0.0 );
				renderer.clear();

			}

			this.fsQuad.material = passMaterial;
			this.fsQuad.render( renderer );

			// restore original state
			renderer.autoClear = originalAutoClear;
			renderer.setClearColor( this.originalClearColor );
			renderer.setClearAlpha( originalClearAlpha );

		}
		renderOverride( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

			renderer.getClearColor( this.originalClearColor );
			const originalClearAlpha = renderer.getClearAlpha();
			const originalAutoClear = renderer.autoClear;
			renderer.setRenderTarget( renderTarget );
			renderer.autoClear = false;
			clearColor = overrideMaterial.clearColor || clearColor;
			clearAlpha = overrideMaterial.clearAlpha || clearAlpha;
			if ( clearColor !== undefined && clearColor !== null ) {

				renderer.setClearColor( clearColor );
				renderer.setClearAlpha( clearAlpha || 0.0 );
				renderer.clear();

			}

			this.scene.overrideMaterial = overrideMaterial;
			renderer.render( this.scene, this.camera );
			this.scene.overrideMaterial = null;

			// restore original state
			renderer.autoClear = originalAutoClear;
			renderer.setClearColor( this.originalClearColor );
			renderer.setClearAlpha( originalClearAlpha );

		}
		setSize( width, height ) {

			this.beautyRenderTarget.setSize( width, height );
			this.saoRenderTarget.setSize( width, height );
			this.blurIntermediateRenderTarget.setSize( width, height );
			this.normalRenderTarget.setSize( width, height );
			this.depthRenderTarget.setSize( width, height );
			this.saoMaterial.uniforms[ 'size' ].value.set( width, height );
			this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.copy( this.camera.projectionMatrixInverse );
			this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
			this.saoMaterial.needsUpdate = true;
			this.vBlurMaterial.uniforms[ 'size' ].value.set( width, height );
			this.vBlurMaterial.needsUpdate = true;
			this.hBlurMaterial.uniforms[ 'size' ].value.set( width, height );
			this.hBlurMaterial.needsUpdate = true;

		}
		dispose() {

			this.saoRenderTarget.dispose();
			this.blurIntermediateRenderTarget.dispose();
			this.beautyRenderTarget.dispose();
			this.normalRenderTarget.dispose();
			this.depthRenderTarget.dispose();
			this.depthMaterial.dispose();
			this.normalMaterial.dispose();
			this.saoMaterial.dispose();
			this.vBlurMaterial.dispose();
			this.hBlurMaterial.dispose();
			this.materialCopy.dispose();
			this.depthCopy.dispose();
			this.fsQuad.dispose();

		}

	}
	SAOPass.OUTPUT = {
		'Beauty': 1,
		'Default': 0,
		'SAO': 2,
		'Depth': 3,
		'Normal': 4
	};

	THREE.SAOPass = SAOPass;

} )();
( function () {

	/**
 * https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts
 */
	class RoomEnvironment extends THREE.Scene {

		constructor() {

			super();
			const geometry = new THREE.BoxGeometry();
			geometry.deleteAttribute( 'uv' );
			const roomMaterial = new THREE.MeshStandardMaterial( {
				side: THREE.BackSide
			} );
			const boxMaterial = new THREE.MeshStandardMaterial();
			const mainLight = new THREE.PointLight( 0xffffff, 5.0, 28, 2 );
			mainLight.position.set( 0.418, 16.199, 0.300 );
			this.add( mainLight );
			const room = new THREE.Mesh( geometry, roomMaterial );
			room.position.set( - 0.757, 13.219, 0.717 );
			room.scale.set( 31.713, 28.305, 28.591 );
			this.add( room );
			const box1 = new THREE.Mesh( geometry, boxMaterial );
			box1.position.set( - 10.906, 2.009, 1.846 );
			box1.rotation.set( 0, - 0.195, 0 );
			box1.scale.set( 2.328, 7.905, 4.651 );
			this.add( box1 );
			const box2 = new THREE.Mesh( geometry, boxMaterial );
			box2.position.set( - 5.607, - 0.754, - 0.758 );
			box2.rotation.set( 0, 0.994, 0 );
			box2.scale.set( 1.970, 1.534, 3.955 );
			this.add( box2 );
			const box3 = new THREE.Mesh( geometry, boxMaterial );
			box3.position.set( 6.167, 0.857, 7.803 );
			box3.rotation.set( 0, 0.561, 0 );
			box3.scale.set( 3.927, 6.285, 3.687 );
			this.add( box3 );
			const box4 = new THREE.Mesh( geometry, boxMaterial );
			box4.position.set( - 2.017, 0.018, 6.124 );
			box4.rotation.set( 0, 0.333, 0 );
			box4.scale.set( 2.002, 4.566, 2.064 );
			this.add( box4 );
			const box5 = new THREE.Mesh( geometry, boxMaterial );
			box5.position.set( 2.291, - 0.756, - 2.621 );
			box5.rotation.set( 0, - 0.286, 0 );
			box5.scale.set( 1.546, 1.552, 1.496 );
			this.add( box5 );
			const box6 = new THREE.Mesh( geometry, boxMaterial );
			box6.position.set( - 2.193, - 0.369, - 5.547 );
			box6.rotation.set( 0, 0.516, 0 );
			box6.scale.set( 3.875, 3.487, 2.986 );
			this.add( box6 );

			// -x right
			const light1 = new THREE.Mesh( geometry, createAreaLightMaterial( 50 ) );
			light1.position.set( - 16.116, 14.37, 8.208 );
			light1.scale.set( 0.1, 2.428, 2.739 );
			this.add( light1 );

			// -x left
			const light2 = new THREE.Mesh( geometry, createAreaLightMaterial( 50 ) );
			light2.position.set( - 16.109, 18.021, - 8.207 );
			light2.scale.set( 0.1, 2.425, 2.751 );
			this.add( light2 );

			// +x
			const light3 = new THREE.Mesh( geometry, createAreaLightMaterial( 17 ) );
			light3.position.set( 14.904, 12.198, - 1.832 );
			light3.scale.set( 0.15, 4.265, 6.331 );
			this.add( light3 );

			// +z
			const light4 = new THREE.Mesh( geometry, createAreaLightMaterial( 43 ) );
			light4.position.set( - 0.462, 8.89, 14.520 );
			light4.scale.set( 4.38, 5.441, 0.088 );
			this.add( light4 );

			// -z
			const light5 = new THREE.Mesh( geometry, createAreaLightMaterial( 20 ) );
			light5.position.set( 3.235, 11.486, - 12.541 );
			light5.scale.set( 2.5, 2.0, 0.1 );
			this.add( light5 );

			// +y
			const light6 = new THREE.Mesh( geometry, createAreaLightMaterial( 100 ) );
			light6.position.set( 0.0, 20.0, 0.0 );
			light6.scale.set( 1.0, 0.1, 1.0 );
			this.add( light6 );

		}
		dispose() {

			const resources = new Set();
			this.traverse( object => {

				if ( object.isMesh ) {

					resources.add( object.geometry );
					resources.add( object.material );

				}

			} );
			for ( const resource of resources ) {

				resource.dispose();

			}

		}

	}
	function createAreaLightMaterial( intensity ) {

		const material = new THREE.MeshBasicMaterial();
		material.color.setScalar( intensity );
		return material;

	}

	THREE.RoomEnvironment = RoomEnvironment;

} )();
