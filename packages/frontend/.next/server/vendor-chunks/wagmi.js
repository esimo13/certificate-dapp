"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/wagmi";
exports.ids = ["vendor-chunks/wagmi"];
exports.modules = {

/***/ "(ssr)/../../node_modules/wagmi/dist/esm/context.js":
/*!****************************************************!*\
  !*** ../../node_modules/wagmi/dist/esm/context.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   WagmiContext: () => (/* binding */ WagmiContext),\n/* harmony export */   WagmiProvider: () => (/* binding */ WagmiProvider)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(ssr)/../../node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js\");\n/* harmony import */ var _hydrate_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./hydrate.js */ \"(ssr)/../../node_modules/wagmi/dist/esm/hydrate.js\");\n/* __next_internal_client_entry_do_not_use__ WagmiContext,WagmiProvider auto */ \n\nconst WagmiContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(undefined);\nfunction WagmiProvider(parameters) {\n    const { children, config } = parameters;\n    const props = {\n        value: config\n    };\n    return /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_hydrate_js__WEBPACK_IMPORTED_MODULE_1__.Hydrate, parameters, /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(WagmiContext.Provider, props, children));\n} //# sourceMappingURL=context.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3dhZ21pL2Rpc3QvZXNtL2NvbnRleHQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7OztnRkFHb0Q7QUFDZDtBQUUvQixNQUFNLFlBQVksaUJBQUcsb0RBQWEsQ0FFdkMsU0FBUyxDQUFDO0FBUU4sU0FBVSxhQUFhLENBQzNCLFVBQXVEO0lBRXZELE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsVUFBVTtJQUV2QyxNQUFNLEtBQUssR0FBRztRQUFFLEtBQUssRUFBRSxNQUFNO0lBQUEsQ0FBRTtJQUMvQixxQkFBTyxvREFBYSxDQUNsQixnREFBTyxFQUNQLFVBQVUsZ0JBQ1Ysb0RBQWEsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FDdEQ7QUFDSCxDQUFDIiwic291cmNlcyI6WyJEOlxcZGFwcFxcY2VydGlmaWNhdGVcXHNyY1xcY29udGV4dC50cyJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/wagmi/dist/esm/context.js\n");

/***/ }),

/***/ "(ssr)/../../node_modules/wagmi/dist/esm/hydrate.js":
/*!****************************************************!*\
  !*** ../../node_modules/wagmi/dist/esm/hydrate.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Hydrate: () => (/* binding */ Hydrate)\n/* harmony export */ });\n/* harmony import */ var _wagmi_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wagmi/core */ \"(ssr)/../../node_modules/@wagmi/core/dist/esm/hydrate.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(ssr)/../../node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js\");\n/* __next_internal_client_entry_do_not_use__ Hydrate auto */ \n\nfunction Hydrate(parameters) {\n    const { children, config, initialState, reconnectOnMount = true } = parameters;\n    const { onMount } = (0,_wagmi_core__WEBPACK_IMPORTED_MODULE_1__.hydrate)(config, {\n        initialState,\n        reconnectOnMount\n    });\n    // Hydrate for non-SSR\n    if (!config._internal.ssr) onMount();\n    // Hydrate for SSR\n    const active = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(true);\n    // biome-ignore lint/correctness/useExhaustiveDependencies: `queryKey` not required\n    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)({\n        \"Hydrate.useEffect\": ()=>{\n            if (!active.current) return;\n            if (!config._internal.ssr) return;\n            onMount();\n            return ({\n                \"Hydrate.useEffect\": ()=>{\n                    active.current = false;\n                }\n            })[\"Hydrate.useEffect\"];\n        }\n    }[\"Hydrate.useEffect\"], []);\n    return children;\n} //# sourceMappingURL=hydrate.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3dhZ21pL2Rpc3QvZXNtL2h5ZHJhdGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7OzZEQUV3RTtBQUNaO0FBUXRELFNBQVUsT0FBTyxDQUFDLFVBQWlEO0lBQ3ZFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsR0FBRyxJQUFJLEVBQUUsR0FBRyxVQUFVO0lBRTlFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxvREFBTyxDQUFDLE1BQU0sRUFBRTtRQUNsQyxZQUFZO1FBQ1osZ0JBQWdCO0tBQ2pCLENBQUM7SUFFRixzQkFBc0I7SUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRTtJQUVwQyxrQkFBa0I7SUFDbEIsTUFBTSxNQUFNLEdBQUcsNkNBQU0sQ0FBQyxJQUFJLENBQUM7SUFDM0IsbUZBQW1GO0lBQ25GLGdEQUFTOzZCQUFDLEdBQUcsRUFBRTtZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU07WUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU07WUFDakMsT0FBTyxFQUFFO1lBQ1Q7cUNBQU8sR0FBRyxFQUFFO29CQUNWLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSztnQkFDeEIsQ0FBQzs7UUFDSCxDQUFDOzRCQUFFLEVBQUUsQ0FBQztJQUVOLE9BQU8sUUFBd0I7QUFDakMsQ0FBQyIsInNvdXJjZXMiOlsiRDpcXGRhcHBcXGNlcnRpZmljYXRlXFxzcmNcXGh5ZHJhdGUudHMiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/wagmi/dist/esm/hydrate.js\n");

/***/ })

};
;