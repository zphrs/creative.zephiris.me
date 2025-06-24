import { browser } from '$app/environment';
import { localMomentumLayer } from '@aninest/extensions';
import {
	addExtensionToStack,
	addLayerToStack,
	addLocalListener,
	addRecursiveListener,
	addVec,
	changeInterpFunction,
	clamp,
	createAnimation,
	createExtensionStack,
	createMode,
	getInterpFunction,
	getLinearInterp,
	getLocalInterpingTo,
	getLocalState,
	getStateTree,
	mag,
	magSquared,
	modifyTo,
	mulScalar,
	newVec2,
	NO_INTERP,
	normalize,
	sleep,
	subVec,
	type Extension,
	type Vec2
} from 'aninest';

const psDown: Record<number, boolean> = {};
if (browser)
	window.addEventListener('pointerdown', (e) => {
		psDown[e.pointerId] = true;
	});
export function createParticle(field: (pos: Vec2) => Vec2, screenDims: Vec2) {
	const glideLayer = localMomentumLayer(0.16 * Math.random() + 0.16, 1);
	const pdownStack = createExtensionStack<Vec2>();
	addLayerToStack(pdownStack, glideLayer);
	addExtensionToStack(pdownStack, (posAnim) => {
		const oldVelInterp = getInterpFunction(anim.children.vel);
		const oldPosInterp = getInterpFunction(anim.children.pos);
		changeInterpFunction(anim.children.vel, getLinearInterp(0.05));
		changeInterpFunction(anim.children.pos, getLinearInterp(0.05));
		const unsub = addRecursiveListener(posAnim, 'beforeEnd', () => {
			glideLayer.clearRecordedStates();
			if (pointerId && psDown[pointerId]) {
				const oldPos = getLocalInterpingTo(posAnim);
				modifyTo(posAnim, addVec(oldPos, newVec2(Math.random() - 0.5, Math.random() - 0.5)));
				modifyTo(anim, {
					vel: newVec2(Math.random() - 0.5, Math.random() - 0.5)
				});
				return;
			}
			pDownMode.off();
			defaultMode.on();
			step();
		});
		return () => {
			unsub();
			changeInterpFunction(anim.children.vel, oldVelInterp);
			changeInterpFunction(anim.children.pos, oldPosInterp);
		};
	});
	const step = (reset: boolean = false) => {
		if (pointerId) {
			pointerId = undefined;
			pPosOffset = undefined;
		}

		const to = getLocalInterpingTo(anim.children.pos);
		const oldVel = getLocalInterpingTo(anim.children.vel);
		const vMag = magSquared(oldVel);

		if (vMag > 5000) {
			return;
		}
		if (vMag < 0.01) {
			return;
		}
		const newPos = addVec(to, mulScalar(field(to), 0.0025));
		const diff = subVec(newPos, to);
		if (reset || getInterpFunction(anim) == NO_INTERP || mag(diff) > 1000) {
			const vel = newVec2(Math.random(), Math.random());
			modifyTo(anim.children.vel, vel);
			modifyTo(anim.children.pos, newPos);
			return;
		}
		modifyTo(anim.children.vel, mulScalar(diff, 0.25));
		modifyTo(anim.children.pos, newPos);
	};
	let pointerId: number | undefined = undefined;
	let pPosOffset: Vec2 | undefined = undefined;
	window.addEventListener('pointerout', (e) => {
		delete psDown[e.pointerId];
		if (e.pointerId != pointerId) return;

		pointerId = undefined;
		pPosOffset = undefined;
		if (glideLayer.startGlide()) {
			modifyTo(anim.children.vel, mulScalar(normalize(getLocalState(anim.children.vel)), 100));
		}
		setTimeout(() => {
			defaultMode.on();
		}, 100);
	});
	window.addEventListener('pointerup', (e) => {
		psDown[e.pointerId] = false;
		if (e.pointerId != pointerId) return;
		pointerId = undefined;
		pPosOffset = undefined;
		if (glideLayer.startGlide()) {
			modifyTo(anim.children.vel, mulScalar(normalize(getLocalState(anim.children.vel)), 70));
		}
		setTimeout(() => {
			defaultMode.on();
		}, 100);
	});
	window.addEventListener('pointermove', (e) => {
		const pPos = newVec2(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio);
		const myPos = getLocalState(anim.children.pos);
		const offset = subVec(myPos, pPos);
		if (pointerId && pPosOffset && e.pointerId == pointerId) {
			const oldPos = getLocalState(anim.children.pos);
			const newPos = addVec(pPos, pPosOffset);
			modifyTo(anim.children.pos, addVec(pPos, pPosOffset));
			const diff = subVec(newPos, oldPos);
			const adjMag = clamp(1, mag(diff), 70);
			modifyTo(anim.children.vel, mulScalar(normalize(diff), adjMag));
		} else {
			const dist = magSquared(offset);
			if (dist < 4050 * Math.random() ** 2 && psDown[e.pointerId]) {
				pointerId = e.pointerId;
				pPosOffset = offset;
				defaultMode.off();
				glideLayer.clearRecordedStates();
				pDownMode.on();
			}
		}
	});
	const initPos = newVec2(
		Math.random() * devicePixelRatio * screenDims.x,
		Math.random() * devicePixelRatio * screenDims.y
	);
	let resetting = false;
	const anim = createAnimation(
		{
			pos: initPos,
			color: {
				r: 0,
				g: 0,
				b: 0
			},
			vel: newVec2(Math.random(), Math.random()),
			draw(ctx: CanvasRenderingContext2D) {
				if (resetting) return;
				const { pos, vel } = getStateTree(anim);
				const velMag = mag(vel);
				const magVel = velMag < 10 ? Math.sqrt(velMag / 10) * 10 : velMag;
				const end = subVec(pos, mulScalar(normalize(vel), magVel));
				ctx.beginPath();
				ctx.moveTo(pos.x, pos.y);
				ctx.lineTo(end.x, end.y);
				ctx.stroke();
			},
			step,
			reset: (screenDims: Vec2) => {
				resetting = true;
				const newPos = newVec2(
					0.6 * devicePixelRatio * screenDims.x,
					1 * devicePixelRatio * screenDims.y
				);
				// changeInterpFunction(anim.children.pos, NO_INTERP);
				const vel = newVec2(Math.random(), Math.random());
				modifyTo(
					anim,
					{ pos: newPos, vel },
					{ update: true, end: true, interrupt: true, start: true }
				);
				step(true);
				sleep(0.5).then(() => {
					resetting = false;
				});
			}
		},
		getLinearInterp(0.25)
	);
	const { reset } = getLocalState(anim);
	reset(screenDims);
	changeInterpFunction(anim.children.vel, getLinearInterp(0.125));
	const pDownMode = createMode(anim.children.pos, pdownStack);
	const pUpExt: Extension<Vec2> = (anim) => {
		return addLocalListener(anim, 'beforeEnd', () => step());
	};
	const defaultStack = createExtensionStack<Vec2>();
	addExtensionToStack(defaultStack, pUpExt);
	const defaultMode = createMode(anim.children.pos, defaultStack);
	defaultMode.on();
	step(true);
	return {
		anim
	};
}
