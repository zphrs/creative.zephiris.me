import {
	addLocalListener,
	addVec,
	changeInterpFunction,
	createAnimation,
	getInterpFunction,
	getLinearInterp,
	getLocalInterpingTo,
	getStateTree,
	magSquared,
	modifyTo,
	mulScalar,
	newVec2,
	NO_INTERP,
	subVec,
	type Vec2
} from 'aninest';
export function createParticle(field: (pos: Vec2) => Vec2, screenDims: Vec2) {
	const step = () => {
		const to = getLocalInterpingTo(anim.children.pos);
		const oldVel = getLocalInterpingTo(anim.children.vel);
		const vMag = magSquared(oldVel);
		if (magSquared(oldVel) < Math.random() ** 0.05) {
			return;
		}

		if (vMag > 1000000) {
			return;
		}
		const newPos = addVec(to, mulScalar(field(to), 0.001));
		modifyTo(anim.children.pos, newPos, true);
		modifyTo(anim.children.vel, subVec(newPos, to));
	};
	const initPos = newVec2(
		Math.random() * devicePixelRatio * screenDims.x,
		Math.random() * devicePixelRatio * screenDims.y
	);
	const anim = createAnimation(
		{
			pos: initPos,
			color: {
				r: 0,
				g: 0,
				b: 0
			},
			prevPos: initPos,
			vel: newVec2(0, 1),
			draw(ctx: CanvasRenderingContext2D) {
				const { pos, vel } = getStateTree(anim);
				const vMag = magSquared(vel);
				if (vMag > 10000) {
					return;
				}
				const end = subVec(pos, mulScalar(vel, 2));
				ctx.beginPath();
				ctx.moveTo(pos.x, pos.y);
				ctx.lineTo(end.x, end.y);
				ctx.stroke();
			},
			step,
			reset: (screenDims: Vec2) => {
				const newPos = newVec2(
					Math.random() * devicePixelRatio * screenDims.x,
					Math.random() * devicePixelRatio * screenDims.y
				);
				const interp = getInterpFunction(anim.children.pos);
				changeInterpFunction(anim.children.pos, NO_INTERP);
				modifyTo(anim, { pos: newPos, prevPos: initPos, vel: newVec2(0, 1) }, true);
				changeInterpFunction(anim.children.pos, interp);
				step();
				// sleep(2).then(() => {});
			}
		},
		getLinearInterp(0.02)
	);
	addLocalListener(anim.children.pos, 'beforeEnd', step);

	return {
		anim
	};
}
