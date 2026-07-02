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
	ZERO_VEC2,
	type Extension,
	type Vec2
} from 'aninest';

const psDown: Record<number, boolean> = {};

export function createParticle(
	field: (pos: Vec2) => Vec2,
	screenDims: Vec2,
	parentElement: HTMLElement
) {
	const ac = new AbortController();
	if (browser)
		parentElement.addEventListener(
			'pointerdown',
			(e) => {
				psDown[e.pointerId] = true;
			},
			{ signal: ac.signal }
		);
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
			if (pointerId !== undefined && psDown[pointerId]) {
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
		if (pointerId !== undefined) {
			pointerId = undefined;
			pPosOffset = undefined;
		}

		const to = getLocalInterpingTo(anim.children.pos);
		const diff = mulScalar(field(to), 0.01);
		let diffMag = mag(diff);
		if (to.x > screenDims.x * window.devicePixelRatio + 100 || to.y < -100) return;
		if (reset || getInterpFunction(anim) == NO_INTERP) {
			const newPos = addVec(to, diff);
			const vel = newVec2(Math.random(), Math.random());
			modifyTo(anim.children.vel, vel);
			modifyTo(anim.children.pos, newPos);
			return;
		}
		let newInterp = clamp(0.01, 50 / diffMag, 0.25);
		changeInterpFunction(anim.children.pos, getLinearInterp(newInterp));
		const newVel = mulScalar(diff, 0.05);
		modifyTo(anim.children.vel, newVel);
		const newPos = addVec(to, mulScalar(diff, newInterp));
		modifyTo(anim.children.pos, newPos);
	};
	let pointerId: number | undefined = undefined;
	let pPosOffset: Vec2 | undefined = undefined;
	parentElement.addEventListener(
		'pointerout',
		(e) => {
			delete psDown[e.pointerId];
			if (e.pointerId != pointerId) return;

			pointerId = undefined;
			pPosOffset = undefined;
			glideLayer.startGlide();
			setTimeout(() => {
				defaultMode.on();
			}, 10);
		},
		{ signal: ac.signal }
	);
	parentElement.addEventListener(
		'pointerup',
		(e) => {
			delete psDown[e.pointerId];
			if (e.pointerId != pointerId) return;
			pointerId = undefined;
			pPosOffset = undefined;
			glideLayer.startGlide();
			setTimeout(() => {
				defaultMode.on();
			}, 10);
		},
		{ signal: ac.signal }
	);
	parentElement.addEventListener(
		'pointermove',
		(e) => {
			const elementOffset = parentElement.getBoundingClientRect();
			const pPos = newVec2(
				(e.clientX - elementOffset.x) * devicePixelRatio,
				(e.clientY - elementOffset.y) * devicePixelRatio
			);
			const myPos = getLocalState(anim.children.pos);
			const offset = subVec(myPos, pPos);
			if (pointerId !== undefined && pPosOffset && e.pointerId == pointerId) {
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
		},
		{ signal: ac.signal }
	);
	const initPos = newVec2(
		Math.random() * devicePixelRatio * screenDims.x,
		devicePixelRatio * screenDims.y
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
			vel: newVec2(0, 0),
			draw(ctx: CanvasRenderingContext2D) {
				if (resetting) return;
				const { pos, vel } = getStateTree(anim);
				const velMag = mag(vel);

				const magVel = Math.sqrt(velMag / 100) * 50 + 2;
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
					Math.random() * devicePixelRatio * screenDims.x,
					devicePixelRatio * screenDims.y
				);
				changeInterpFunction(anim.children.pos, NO_INTERP);
				let oldInterp = getInterpFunction(anim.children.vel);
				changeInterpFunction(anim.children.vel, NO_INTERP);
				const vel = newVec2(Math.random() * 0, Math.random() * 0);
				modifyTo(
					anim,
					{ pos: newPos, vel },
					{ update: true, end: true, interrupt: true, start: true }
				);
				changeInterpFunction(anim.children.vel, oldInterp);
				resetting = false;
				step();
				// step(true);
				sleep(0.0).then(() => {});
			}
		},
		getLinearInterp(0.25)
	);
	const { reset } = getLocalState(anim);
	reset(screenDims);
	changeInterpFunction(anim.children.vel, getLinearInterp(0.1));
	const pDownMode = createMode(anim.children.pos, pdownStack);
	const pUpExt: Extension<Vec2> = (anim) => {
		return addLocalListener(anim, 'beforeEnd', () => step());
	};
	const defaultStack = createExtensionStack<Vec2>();
	addExtensionToStack(defaultStack, pUpExt);
	const defaultMode = createMode(anim.children.pos, defaultStack);
	defaultMode.on();
	step();
	return {
		anim,
		unsub: () => {
			ac.abort('unsub'), defaultMode.off();
		}
	};
}
