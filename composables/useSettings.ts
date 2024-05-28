const settings = ref({
    disturbance: {
        TWS: {
            name: "Force du vent réel (noeuds)",
            val: 15,
            max: 80,
            min: 0,
            step: 1,
        },
        TWA_mg: {
            name: "Angle vent réel (0° = Nord) (°)",
            val: 40,
            max: 180,
            min: -180,
            step: 2,
        },
    },
    modelParams: {
        // Cadalen's model
        r: { val: 50, name: "cable length (m)", max: 100, min: 0, step: 1, disabled: false },
        A_k: { val: 15, name: "kite surface (m^2)", max: 100, min: 0, step: 1, disabled: false },
        C_L: { val: 1.2, name: "lift force coef", max: 100, min: 0, step: 1, disabled: false },
        C_D: { val: 0.2, name: "drag force coef", max: 100, min: 0, step: 1, disabled: false },
        C_T: { val: 0.2, name: "trans force coef", max: 100, min: 0, step: 1, disabled: false },
        m: { val: 4, name: "kite's mass (kg)", max: 100, min: 0, step: 1, disabled: false },
        g_k: { val: 0.16652, name: "turn rate", max: 100, min: 0, step: 1, disabled: false },
        M_k: { val: -3.6438, name: "mass distribution effect", max: 100, min: 0, step: 1, disabled: false },
        rho_air: { val: 1.225, name: "air density (kg/m^3)", max: 100, min: 0, step: 1, disabled: false },
        g: { val: 9.81, name: "gravity acc (m/s^2)", max: 100, min: 0, step: 1, disabled: false },
        K_i: { val: 0.4474, name: "border/choquer coef", max: 100, min: 0, step: 1, disabled: false },
        alpha_i0: { val: 30 * Math.PI / 180, name: "initial val for alpha (°)", max: 100, min: 0, step: 1, disabled: false },
        // Boat model
        foilCoef: { val: 0.95, name: "foil coef", max: 1, min: 0, step: 0.01, disabled: false },
        boatMass: { val: 100, name: "boat mass (kg)", max: 10000, min: 0, step: 1, disabled: false },
        waterFriction: { val: 0.99, name: "water friction coef", max: 1, min: 0, step: 0.01, disabled: false },
    },
})
const defaultSettings = settings.value

export const useSettings = () => ({
    settings,
    defaultSettings,
})