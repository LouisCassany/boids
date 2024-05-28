import * as utils from "../physics/utils"

const state = ref({
    // Cadalen states
    theta: Math.PI / 4, // Kite elevation angle
    phi: -40 * Math.PI / 180,             // Kite azimuth angle
    dtheta: 0,
    dphi: 0,
    psi: 0,             // Kite heading angle (yaw)

    // Boat states
    boat_heading: 0,    // Boat heading angle in the general magnetic frame
    boat_speed: 0,      // (knots)
    awa_mg: 0,          // Apparent wind angle in the general magnetic frame
    awa_b: 0,           // Apparent wind angle in the boat frame
    twa_b: 0,           // True wind angle in the boat frame
    aws: 0,             // Apparent wind speed seen from the boat (knots)
})
const initialState = state.value;
type State = typeof state.value;

const input = ref({
    delta: {
        name: "Commande différentielle (m)",
        val: 0,
        step: 0.01,
        max: 0.4,
        min: -0.4,
    },
    epsilon: {
        name: "Border/Choquer (m)",
        val: 0,
        step: 0.5,
        max: 5,
        min: -5,
    },
    boat_heading_speed: {
        name: "Vitesse rotation gouvernail (rad/s)",
        val: 0,
        step: 0.05,
        max: Math.PI,
        min: -Math.PI,
    },
})
type Input = typeof input.value;


const output = ref({
    kite_speed: 0,
    leftTether: [0, 0, 0],
    rightTether: [0, 0, 0],
    traction: 0,
})
const initialOutput = output.value;
type Output = typeof output.value;

const resetModelState = () => state.value = initialState
const resetModelInput = () => {
    input.value.delta.val = 0
    input.value.epsilon.val = 0
    input.value.boat_heading_speed.val = 0
}
const resetModelOutput = () => output.value = initialOutput

// Model definition
const { settings } = useSettings()
const disturbance = settings.value.disturbance;
const PI = Math.PI

function knot_to_mps(knot: number) {
    return knot * 0.514444
}

function radians(degrees: number) {
    return degrees * Math.PI / 180
}

function b_M_K0(v: number[], psi: number): [number, number, number] {
    const [x, y, z] = v
    return [
        x * Math.cos(psi) - y * Math.sin(psi),
        x * Math.sin(psi) + y * Math.cos(psi),
        z
    ]
}

function WR_M_k0(v: number[], phi: number, theta: number): [number, number, number] {
    const [x, y, z] = v
    return [
        x * Math.cos(phi) * Math.cos(theta - PI / 2) - y * Math.sin(phi) + z * Math.cos(phi) * Math.sin(theta - PI / 2),
        y * Math.cos(phi) + x * Math.sin(phi) * Math.cos(theta - PI / 2) + z * Math.sin(phi) * Math.sin(theta - PI / 2),
        z * Math.cos(theta - PI / 2) - x * Math.sin(theta - PI / 2)
    ]
}

function k0_M_WR(v: number[], phi: number, theta: number): [number, number, number] {
    const [x, y, z] = v
    return [
        x * Math.cos(phi) * Math.cos(theta - PI / 2) - z * Math.sin(theta - PI / 2) + y * Math.sin(phi) * Math.cos(theta - PI / 2),
        y * Math.cos(phi) - x * Math.sin(phi),
        z * Math.cos(theta - PI / 2) + x * Math.cos(phi) * Math.sin(theta - PI / 2) + y * Math.sin(phi) * Math.sin(theta - PI / 2)
    ]
}

function nextSimulationStep(state: State, input: Input, deltaT: number): { state: State, output: Output } {
    const { r, m, g_k, M_k, A_k, rho_air, g, K_i, alpha_i0, C_L, C_D } = settings.value.modelParams
    const { theta, phi, psi, dtheta, dphi, boat_speed } = state
    const { delta, epsilon } = input
    const { TWS, TWA_mg } = disturbance // Wind speed is in knots, wind angle in degrees

    const twa_mg = radians(TWA_mg.val);
    const ba_mg = state.boat_heading;
    let x = knot_to_mps(TWS.val) * Math.cos(twa_mg) - knot_to_mps(boat_speed) * Math.cos(ba_mg)
    let z = knot_to_mps(TWS.val) * Math.sin(twa_mg) - knot_to_mps(boat_speed) * Math.sin(ba_mg)
    const awa_mg = Math.atan2(z, x)
    const aws = Math.sqrt(x ** 2 + z ** 2)
    const awa_b = awa_mg - ba_mg
    const twa_b = twa_mg - ba_mg


    const V_WR = [knot_to_mps(TWS.val) * Math.cos(twa_mg), -knot_to_mps(TWS.val) * Math.sin(twa_mg), 0];
    const V_k_k0 = [-r.val * dtheta, r.val * state.dphi * Math.cos(theta), 0];
    const V_a_WR = utils.subtract(V_WR, WR_M_k0(V_k_k0, phi, theta));
    const modV_a_WR = Math.sqrt(V_a_WR[0] ** 2 + V_a_WR[1] ** 2 + V_a_WR[2] ** 2);

    const yb_k0 = b_M_K0([0, 1, 0], PI + psi);
    const zb_k0 = b_M_K0([0, 0, 1], PI + psi);
    const xa_WR = utils.multiply(V_a_WR, -1 / modV_a_WR);
    const xa_k0 = k0_M_WR(xa_WR, phi, theta);

    const alpha_0 = PI / 2 - Math.acos(utils.dot(zb_k0, xa_k0) / (utils.norm(zb_k0) * utils.norm(xa_k0)));
    const alpha_i = K_i.val * epsilon.val + alpha_i0.val;
    const alpha = alpha_0 + alpha_i;

    const lift = 0.5 * rho_air.val * C_L.val * alpha * A_k.val * modV_a_WR * modV_a_WR;
    const drag = 0.5 * rho_air.val * C_D.val * alpha * A_k.val * modV_a_WR * modV_a_WR;

    const minus_xa_k0 = utils.multiply(xa_k0, -1);
    const c = utils.cross(minus_xa_k0, yb_k0);
    const x_lift_k0 = utils.multiply(c, 1 / utils.norm(c));
    const x_drag_k0 = minus_xa_k0;

    const F_a_k0 = utils.add(utils.multiply(x_lift_k0, lift), utils.multiply(x_drag_k0, drag));
    const P_k0 = [m.val * g.val * Math.cos(theta), 0, m.val * g.val * Math.sin(theta)];

    const F_ext_k0 = utils.add(F_a_k0, P_k0);
    const k0_Va = k0_M_WR(V_a_WR, phi, theta);
    const Rb_Va = b_M_K0(k0_Va, -PI - psi);
    const va = -Rb_Va[0];

    const ddtheta = (-F_ext_k0[0] / (r.val * m.val)) - Math.sin(theta) * Math.cos(theta) * dphi * dphi;
    const ddphi = (F_ext_k0[1] / (r.val * m.val * Math.cos(theta))) + 2 * Math.tan(theta) * dtheta * dphi;
    const dpsi = g_k.val * va * delta.val + (M_k.val * ((Math.cos(theta) * Math.sin(psi)) / va)) - dphi * Math.sin(theta);

    const WR_P = [
        r.val * Math.cos(phi) * Math.cos(theta),
        r.val * Math.sin(phi) * Math.cos(theta),
        -r.val * Math.sin(theta)
    ]
    const kiteHeight = Math.sqrt(A_k.val / 3);
    const b_Pl = [0, -kiteHeight, 0];
    const b_Pr = [0, kiteHeight, 0];

    return {
        state: {
            theta: utils.constrain(Number((theta + dtheta * deltaT).toFixed(4)), 0, 90),
            phi: Number((phi + dphi * deltaT).toFixed(4)),
            psi: Number((psi + dpsi * deltaT).toFixed(4)),
            dtheta: utils.constrain(Number((dtheta + ddtheta * deltaT).toFixed(4)), -1000, 1000),
            dphi: utils.constrain(Number((dphi + ddphi * deltaT).toFixed(4)), -1000, 1000),
            boat_heading: state.boat_heading + input.boat_heading_speed.val * deltaT,
            boat_speed,
            awa_mg,
            aws,
            awa_b,
            twa_b
        },
        output: {
            kite_speed: Math.sqrt(V_k_k0[0] ** 2 + V_k_k0[1] ** 2 + V_k_k0[2] ** 2),
            leftTether: utils.add(WR_M_k0(b_M_K0(b_Pl, psi), phi, theta), WR_P),
            rightTether: utils.add(WR_M_k0(b_M_K0(b_Pr, psi), phi, theta), WR_P),
            traction: utils.norm(F_a_k0)
        }
    }
}

export const useModel = () => ({
    state,
    input,
    output,
    resetModelState,
    resetModelInput,
    resetModelOutput,
    nextSimulationStep
})