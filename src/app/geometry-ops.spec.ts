import {
  point as turfPoint,
  multiPoint as turfMultiPoint,
  Point,
  feature as turfFeature,
  featureCollection as turfFeatureCollection,
  polygon as turfPolygon, FeatureCollection
} from '@turf/helpers';
import {Feature, lineString, LineString, multiLineString, Polygon, polygon} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import * as chai from 'chai';
import GeometryOps from './geometry-ops';
import Brolog from 'brolog';
import LayerGeometries from './layers-geometries';
import {EowWaterBodyIntersection} from './eow-data-struct';

const expect = chai.expect;

let log: Brolog;
let geometryOps;
let layerData;
let layerName;
let layerName2;

const where = 'geometry-ops.spec';

function instanceOfEowWaterBodyIntersection(object: any): object is EowWaterBodyIntersection {
  return 'waterBody' in object &&
    object.waterBody !== null &&
    'polygon' in object.waterBody &&
    'name' in object.waterBody &&
    'eowData' in object;
}

describe('geometry-ops', () => {
  beforeEach(() => {
    log = new Brolog();
    log.level('verbose');
    geometryOps = new GeometryOps(log);
  });

  /**
   * Used http://eguruchela.com/math/Calculator/polygon-centroid-point to calculate centroid
   * to determine the values for more complex polygons (hand verified also)
   */
  describe('centroid', () => {
    describe('using calculateCentroidFromFeatureCollection()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        log.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        log.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });

    describe('using calculateCentroidFromPoints()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];
        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        log.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const value = geometryOps.calculateCentroidFromPoints(coordinates); // calculateCentroidTurfVer
        const centroid = value.geometry.coordinates;

        log.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid from lots and lots of real world data - one polygon', () => {
        const coordinates = [[16545469.349959834, -4163881.1440642932], [16547576.627920548, -4163881.1440642932],
          [16547544.34526822, -4163920.553975751], [16547508.723031165, -4164148.8624180704], [16547567.722361283, -4164242.633314922],
          [16547748.05993637, -4164354.072220663], [16547761.418275267, -4164431.5365082906], [16547636.740445577, -4164551.1315559973],
          [16547513.175810797, -4164624.5200630752], [16547506.496641347, -4164900.410821317], [16547610.023767786, -4165070.2976989476],
          [16547623.382106682, -4165162.717250641], [16547559.92999693, -4165238.8280465687], [16547587.759869628, -4165377.459763792],
          [16547675.702267352, -4165547.3539316286], [16547843.794698456, -4165535.1214648006], [16548152.149687953, -4165374.74147821],
          [16548215.601797702, -4165268.728858963], [16548328.034483403, -4165684.6303158225], [16548446.033143645, -4165855.888379678],
          [16548470.52343162, -4166163.0721525755], [16548529.52276174, -4166256.860040339], [16548876.839573015, -4166371.037667492],
          [16548904.669445714, -4166494.731420497], [16549038.252834665, -4166682.3135847272], [16548790.010370197, -4166860.3836408197],
          [16548787.78398038, -4166967.7707789284], [16548979.253504546, -4167277.704034544], [16548914.688199883, -4167415.001791998],
          [16548951.423631845, -4167829.6241280795], [16548865.707623934, -4168271.4518407104], [16548949.197242033, -4168641.2411550023],
          [16549227.495969014, -4169153.8003736157], [16549253.099451894, -4169383.575975944], [16549205.232070854, -4169459.715685433],
          [16549319.891146371, -4169783.3152731047], [16549436.776611704, -4170047.0967011163], [16549602.642652987, -4170112.363175796],
          [16549554.775271945, -4170218.422015105], [16549536.96415342, -4170355.75611945], [16549565.907221027, -4170401.9877841403],
          [16549567.020415934, -4171061.489836627], [16549656.07600857, -4171186.5956761464], [16550052.373395793, -4171194.754801593],
          [16549875.37540543, -4171322.5818828996], [16549804.130931322, -4171374.257078096], [16549825.281634575, -4171772.708106157],
          [16549777.414253535, -4171863.823489743], [16549807.470516048, -4171910.061433065], [16550094.674802292, -4172054.2162569817],
          [16550182.617200019, -4172179.3332816563], [16550201.541513454, -4172716.536529926], [16550346.256851487, -4173087.8339665714],
          [16550506.556918226, -4173429.2209561877], [16550547.745129822, -4173614.1999656344], [16550566.669443255, -4174166.4350527828],
          [16550639.027112272, -4174336.463702811], [16550713.611171106, -4174445.283405835], [16550649.045866445, -4174582.6698047733],
          [16550752.572992882, -4174737.7416448034], [16550960.740440665, -4174988.037606946], [16551017.51338097, -4175188.0063725496],
          [16551028.645330047, -4175341.726308737], [16551162.228719002, -4175544.422223159], [16551188.945396792, -4175729.436491376],
          [16551216.77526949, -4175821.944782352], [16551206.756515317, -4176296.742119571], [16551158.889134277, -4176372.9292573947],
          [16551157.77593937, -4176434.1514436994], [16551291.359328322, -4176620.5410686517], [16551016.40018606, -4176615.0989914252],
          [16550984.117533734, -4176674.9619877357], [16550962.96683048, -4176981.084631968], [16550913.986254534, -4177087.2091204827],
          [16550970.759194838, -4177288.576325448], [16551000.815457352, -4177334.8368753633], [16551025.305745324, -4177596.076542893],
          [16550994.136287903, -4177642.338375257], [16551011.94740643, -4178209.741838826], [16551039.777279127, -4178348.5355938417],
          [16551097.66341434, -4178457.39465632], [16551124.380092127, -4178626.128314868], [16551076.512711087, -4178733.6293232576],
          [16551132.172456486, -4178963.603334064], [16551333.660734821, -4179551.4875730565], [16551436.074666351, -4179769.230386337],
          [16551460.56495433, -4180045.4977351623], [16551505.092750642, -4180108.101145292], [16551452.772589972, -4180383.0159569643],
          [16551404.905208929, -4180489.173005701], [16551447.206615431, -4180642.9664306594], [16551757.787994744, -4181126.136646518],
          [16552049.445060624, -4181745.441945147], [16552061.69020461, -4181854.3343658205], [16551941.465154553, -4181775.3872541836],
          [16551559.639301132, -4181090.748817387], [16551516.224699723, -4180983.2249527625], [16551156.66274446, -4180637.5223791916],
          [16550967.419610111, -4180234.6699890355], [16550940.702932324, -4180049.5805554832], [16550993.023092996, -4179774.6740114545],
          [16550996.362677718, -4179589.592256709], [16550895.061941097, -4179341.91415361], [16550898.401525822, -4179204.4688019636],
          [16550946.268906862, -4179098.3240526905], [16550922.891813794, -4178760.844933724], [16550790.421619752, -4178558.09024044],
          [16550792.648009568, -4178450.590933611], [16550689.120883128, -4178295.4671882996], [16550469.821486266, -4177845.0763279777],
          [16550386.331868172, -4177474.980307025], [16550252.748479221, -4177318.509600423], [16550295.049885724, -4176798.7705731713],
          [16550236.050555604, -4176689.927787285], [16550330.672122775, -4176568.841442791], [16550303.955444984, -4176383.813176935],
          [16550244.956114864, -4176306.265483189], [16550399.690207066, -4176201.5089330003], [16550474.274265898, -4176280.41637239],
          [16550565.55624835, -4176266.811601423], [16550596.725705769, -4176236.8811640185], [16550570.009027978, -4176098.113827396],
          [16550555.53749418, -4176068.1838450762], [16550525.481231665, -4176036.8934953413], [16550329.558927868, -4175909.012113712],
          [16550330.672122775, -4175847.792825043], [16550495.424969152, -4175943.0229755933], [16550565.55624835, -4176001.5219019],
          [16550603.40487522, -4176049.1375347283], [16550626.781968284, -4176081.788372486], [16550736.98826417, -4176102.1951948768],
          [16551046.456448574, -4175955.266911392], [16551037.550889311, -4175679.1014217557], [16550906.193890175, -4175385.2580049983],
          [16550787.082035026, -4175228.8167674555], [16550745.893823434, -4175028.847266457], [16550463.142316818, -4174684.690508319],
          [16550331.785317684, -4174422.159129668], [16550246.069309773, -4174174.596368471], [16550171.485250939, -4174065.7793193813],
          [16549929.921955919, -4173937.9206499094], [16550039.015056897, -4173863.110409278], [16550267.220013022, -4173913.437242926],
          [16550345.14365658, -4173838.62716731], [16550349.59643621, -4173608.759362535], [16549997.826845301, -4172942.3056526473],
          [16550006.73240457, -4172558.7728801267], [16550070.184514318, -4172469.011804136], [16550089.108827753, -4172269.0920157223],
          [16549954.412243893, -4172173.893381702], [16549539.190543232, -4172318.0516310614], [16549460.15370477, -4172424.1315382766],
          [16549465.71967931, -4172852.5414756993], [16549069.42229209, -4172859.3417667258], [16549058.290343009, -4172660.7749837535],
          [16548983.706284177, -4172550.612752321], [16549020.441716138, -4172292.2118071737], [16548991.49864853, -4172244.6122890147],
          [16548969.234750373, -4171846.1443270035], [16549095.025774969, -4171695.1926221577], [16549307.646002386, -4171730.550495107],
          [16549357.739773242, -4171563.2815512316], [16549506.907890905, -4171673.4339870717], [16549570.360000655, -4171582.3201657366],
          [16549317.664756557, -4171255.9484335207], [16549306.532807477, -4170396.548754778], [16549204.118875947, -4170225.220693191],
          [16549182.968172695, -4169780.59590956], [16549086.120215707, -4169334.6292954194], [16548578.503337689, -4168847.893485588],
          [16548506.145668674, -4168677.9488540287], [16548370.335889906, -4168612.6908062734], [16548339.166432483, -4169316.9541582316],
          [16548307.996975062, -4169346.8659453318], [16548096.489942553, -4169250.3327400577], [16547996.302400839, -4169601.1193876327],
          [16547903.907223482, -4169644.628581209], [16547753.625910912, -4169564.4086381053], [16547624.495301591, -4169178.2732885526],
          [16547704.64533496, -4169027.3578386134], [16547675.702267352, -4168934.906143188], [16547585.533479812, -4168871.006156296],
          [16547558.816802023, -4168732.330853297], [16547622.268911775, -4168596.376354225], [16547595.552233983, -4168457.704479038],
          [16547535.439708956, -4168410.1213912917], [16547319.479896815, -4168497.130620404], [16547184.78331296, -4168372.0550678163],
          [16546827.447747512, -4167965.569245397], [16546864.183179474, -4167704.55608905], [16546761.769247942, -4167519.675479347],
          [16546569.186528869, -4167269.5477854987], [16546342.09476765, -4167156.7202878552], [16546423.357995931, -4166975.926806498],
          [16546415.565631576, -4166637.4566922234], [16546190.70026017, -4166433.5640079495], [16546161.757192567, -4166356.085768625],
          [16546196.266234713, -4166218.8010919243], [16545902.382779019, -4165706.3772253045], [16545940.231405888, -4165370.6640510834],
          [16545840.043864176, -4165077.0932280505], [16545677.517407617, -4164858.2792773945], [16545566.197916823, -4164381.252611003],
          [16545445.972866766, -4164302.429662068], [16545469.349959834, -4163881.1440642932], [16547844.907893358, -4166149.479770729],
          [16547778.116198884, -4166392.7859199294], [16547801.493291954, -4166714.9368929886], [16547943.982240168, -4167162.157731351],
          [16547996.302400839, -4167561.817112374], [16548214.488602795, -4168026.745090818], [16548473.863016343, -4168032.182960044],
          [16548624.144328913, -4168143.659865662], [16548687.596438667, -4168068.8886469286], [16548739.91659934, -4167748.057856011],
          [16548766.63327713, -4167242.3603319125], [16548587.408896953, -4167039.815896213], [16548658.653371062, -4166626.5823213058],
          [16548001.868375381, -4165968.70267276], [16547969.58572305, -4166059.770467407], [16547844.907893358, -4166149.479770729]];

        const expectedCentroid = [16548320, -4169418];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        // const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        // const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        log.silly(`Centroid of polygon: ${JSON.stringify(centroid, null, 2)}`);
        log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid, null, 2)}`);

        expect(centroid[0]).to.be.greaterThan(expectedCentroid[0] - 1);
        expect(centroid[0]).to.be.lessThan(expectedCentroid[0] + 1);
        expect(centroid[1]).to.be.greaterThan(expectedCentroid[1] - 1);
        expect(centroid[1]).to.be.lessThan(expectedCentroid[1] + 1);
      });

      // It doesn't appear to be legitimate to calculate centroid of multiple polygons.  Though theoretically you could calculate
      // the centroid using the centroid of each individual polygon as vertices of a contained polygon
      xit('centroid from lots and lots of real world data - multi polygon', () => {
        const coordinates = [[[16545469.349959834, -4163881.1440642932], [16547576.627920548, -4163881.1440642932],
          [16547544.34526822, -4163920.553975751], [16547508.723031165, -4164148.8624180704], [16547567.722361283, -4164242.633314922],
          [16547748.05993637, -4164354.072220663], [16547761.418275267, -4164431.5365082906], [16547636.740445577, -4164551.1315559973],
          [16547513.175810797, -4164624.5200630752], [16547506.496641347, -4164900.410821317], [16547610.023767786, -4165070.2976989476],
          [16547623.382106682, -4165162.717250641], [16547559.92999693, -4165238.8280465687], [16547587.759869628, -4165377.459763792],
          [16547675.702267352, -4165547.3539316286], [16547843.794698456, -4165535.1214648006], [16548152.149687953, -4165374.74147821],
          [16548215.601797702, -4165268.728858963], [16548328.034483403, -4165684.6303158225], [16548446.033143645, -4165855.888379678],
          [16548470.52343162, -4166163.0721525755], [16548529.52276174, -4166256.860040339], [16548876.839573015, -4166371.037667492],
          [16548904.669445714, -4166494.731420497], [16549038.252834665, -4166682.3135847272], [16548790.010370197, -4166860.3836408197],
          [16548787.78398038, -4166967.7707789284], [16548979.253504546, -4167277.704034544], [16548914.688199883, -4167415.001791998],
          [16548951.423631845, -4167829.6241280795], [16548865.707623934, -4168271.4518407104], [16548949.197242033, -4168641.2411550023],
          [16549227.495969014, -4169153.8003736157], [16549253.099451894, -4169383.575975944], [16549205.232070854, -4169459.715685433],
          [16549319.891146371, -4169783.3152731047], [16549436.776611704, -4170047.0967011163], [16549602.642652987, -4170112.363175796],
          [16549554.775271945, -4170218.422015105], [16549536.96415342, -4170355.75611945], [16549565.907221027, -4170401.9877841403],
          [16549567.020415934, -4171061.489836627], [16549656.07600857, -4171186.5956761464], [16550052.373395793, -4171194.754801593],
          [16549875.37540543, -4171322.5818828996], [16549804.130931322, -4171374.257078096], [16549825.281634575, -4171772.708106157],
          [16549777.414253535, -4171863.823489743], [16549807.470516048, -4171910.061433065], [16550094.674802292, -4172054.2162569817],
          [16550182.617200019, -4172179.3332816563], [16550201.541513454, -4172716.536529926], [16550346.256851487, -4173087.8339665714],
          [16550506.556918226, -4173429.2209561877], [16550547.745129822, -4173614.1999656344], [16550566.669443255, -4174166.4350527828],
          [16550639.027112272, -4174336.463702811], [16550713.611171106, -4174445.283405835], [16550649.045866445, -4174582.6698047733],
          [16550752.572992882, -4174737.7416448034], [16550960.740440665, -4174988.037606946], [16551017.51338097, -4175188.0063725496],
          [16551028.645330047, -4175341.726308737], [16551162.228719002, -4175544.422223159], [16551188.945396792, -4175729.436491376],
          [16551216.77526949, -4175821.944782352], [16551206.756515317, -4176296.742119571], [16551158.889134277, -4176372.9292573947],
          [16551157.77593937, -4176434.1514436994], [16551291.359328322, -4176620.5410686517], [16551016.40018606, -4176615.0989914252],
          [16550984.117533734, -4176674.9619877357], [16550962.96683048, -4176981.084631968], [16550913.986254534, -4177087.2091204827],
          [16550970.759194838, -4177288.576325448], [16551000.815457352, -4177334.8368753633], [16551025.305745324, -4177596.076542893],
          [16550994.136287903, -4177642.338375257], [16551011.94740643, -4178209.741838826], [16551039.777279127, -4178348.5355938417],
          [16551097.66341434, -4178457.39465632], [16551124.380092127, -4178626.128314868], [16551076.512711087, -4178733.6293232576],
          [16551132.172456486, -4178963.603334064], [16551333.660734821, -4179551.4875730565], [16551436.074666351, -4179769.230386337],
          [16551460.56495433, -4180045.4977351623], [16551505.092750642, -4180108.101145292], [16551452.772589972, -4180383.0159569643],
          [16551404.905208929, -4180489.173005701], [16551447.206615431, -4180642.9664306594], [16551757.787994744, -4181126.136646518],
          [16552049.445060624, -4181745.441945147], [16552061.69020461, -4181854.3343658205], [16551941.465154553, -4181775.3872541836],
          [16551559.639301132, -4181090.748817387], [16551516.224699723, -4180983.2249527625], [16551156.66274446, -4180637.5223791916],
          [16550967.419610111, -4180234.6699890355], [16550940.702932324, -4180049.5805554832], [16550993.023092996, -4179774.6740114545],
          [16550996.362677718, -4179589.592256709], [16550895.061941097, -4179341.91415361], [16550898.401525822, -4179204.4688019636],
          [16550946.268906862, -4179098.3240526905], [16550922.891813794, -4178760.844933724], [16550790.421619752, -4178558.09024044],
          [16550792.648009568, -4178450.590933611], [16550689.120883128, -4178295.4671882996], [16550469.821486266, -4177845.0763279777],
          [16550386.331868172, -4177474.980307025], [16550252.748479221, -4177318.509600423], [16550295.049885724, -4176798.7705731713],
          [16550236.050555604, -4176689.927787285], [16550330.672122775, -4176568.841442791], [16550303.955444984, -4176383.813176935],
          [16550244.956114864, -4176306.265483189], [16550399.690207066, -4176201.5089330003], [16550474.274265898, -4176280.41637239],
          [16550565.55624835, -4176266.811601423], [16550596.725705769, -4176236.8811640185], [16550570.009027978, -4176098.113827396],
          [16550555.53749418, -4176068.1838450762], [16550525.481231665, -4176036.8934953413], [16550329.558927868, -4175909.012113712],
          [16550330.672122775, -4175847.792825043], [16550495.424969152, -4175943.0229755933], [16550565.55624835, -4176001.5219019],
          [16550603.40487522, -4176049.1375347283], [16550626.781968284, -4176081.788372486], [16550736.98826417, -4176102.1951948768],
          [16551046.456448574, -4175955.266911392], [16551037.550889311, -4175679.1014217557], [16550906.193890175, -4175385.2580049983],
          [16550787.082035026, -4175228.8167674555], [16550745.893823434, -4175028.847266457], [16550463.142316818, -4174684.690508319],
          [16550331.785317684, -4174422.159129668], [16550246.069309773, -4174174.596368471], [16550171.485250939, -4174065.7793193813],
          [16549929.921955919, -4173937.9206499094], [16550039.015056897, -4173863.110409278], [16550267.220013022, -4173913.437242926],
          [16550345.14365658, -4173838.62716731], [16550349.59643621, -4173608.759362535], [16549997.826845301, -4172942.3056526473],
          [16550006.73240457, -4172558.7728801267], [16550070.184514318, -4172469.011804136], [16550089.108827753, -4172269.0920157223],
          [16549954.412243893, -4172173.893381702], [16549539.190543232, -4172318.0516310614], [16549460.15370477, -4172424.1315382766],
          [16549465.71967931, -4172852.5414756993], [16549069.42229209, -4172859.3417667258], [16549058.290343009, -4172660.7749837535],
          [16548983.706284177, -4172550.612752321], [16549020.441716138, -4172292.2118071737], [16548991.49864853, -4172244.6122890147],
          [16548969.234750373, -4171846.1443270035], [16549095.025774969, -4171695.1926221577], [16549307.646002386, -4171730.550495107],
          [16549357.739773242, -4171563.2815512316], [16549506.907890905, -4171673.4339870717], [16549570.360000655, -4171582.3201657366],
          [16549317.664756557, -4171255.9484335207], [16549306.532807477, -4170396.548754778], [16549204.118875947, -4170225.220693191],
          [16549182.968172695, -4169780.59590956], [16549086.120215707, -4169334.6292954194], [16548578.503337689, -4168847.893485588],
          [16548506.145668674, -4168677.9488540287], [16548370.335889906, -4168612.6908062734], [16548339.166432483, -4169316.9541582316],
          [16548307.996975062, -4169346.8659453318], [16548096.489942553, -4169250.3327400577], [16547996.302400839, -4169601.1193876327],
          [16547903.907223482, -4169644.628581209], [16547753.625910912, -4169564.4086381053], [16547624.495301591, -4169178.2732885526],
          [16547704.64533496, -4169027.3578386134], [16547675.702267352, -4168934.906143188], [16547585.533479812, -4168871.006156296],
          [16547558.816802023, -4168732.330853297], [16547622.268911775, -4168596.376354225], [16547595.552233983, -4168457.704479038],
          [16547535.439708956, -4168410.1213912917], [16547319.479896815, -4168497.130620404], [16547184.78331296, -4168372.0550678163],
          [16546827.447747512, -4167965.569245397], [16546864.183179474, -4167704.55608905], [16546761.769247942, -4167519.675479347],
          [16546569.186528869, -4167269.5477854987], [16546342.09476765, -4167156.7202878552], [16546423.357995931, -4166975.926806498],
          [16546415.565631576, -4166637.4566922234], [16546190.70026017, -4166433.5640079495], [16546161.757192567, -4166356.085768625],
          [16546196.266234713, -4166218.8010919243], [16545902.382779019, -4165706.3772253045], [16545940.231405888, -4165370.6640510834],
          [16545840.043864176, -4165077.0932280505], [16545677.517407617, -4164858.2792773945], [16545566.197916823, -4164381.252611003],
          [16545445.972866766, -4164302.429662068], [16545469.349959834, -4163881.1440642932]], [[16547844.907893358, -4166149.479770729],
          [16547778.116198884, -4166392.7859199294], [16547801.493291954, -4166714.9368929886], [16547943.982240168, -4167162.157731351],
          [16547996.302400839, -4167561.817112374], [16548214.488602795, -4168026.745090818], [16548473.863016343, -4168032.182960044],
          [16548624.144328913, -4168143.659865662], [16548687.596438667, -4168068.8886469286], [16548739.91659934, -4167748.057856011],
          [16548766.63327713, -4167242.3603319125], [16548587.408896953, -4167039.815896213], [16548658.653371062, -4166626.5823213058],
          [16548001.868375381, -4165968.70267276], [16547969.58572305, -4166059.770467407], [16547844.907893358, -4166149.479770729]]];

        const expectedCentroid = [2000, 2063];

        // It doesn't appear to be legitimate to calculate centroid of multiple polygons.  Though theoretically you could calculate
        // the centroid using the centroid of each individual polygon as vertices of a contained polygon

        // const value = geometryOps.calculateCentroidFromPoints(coordinates);
        // const points = turfFeatureCollection(coordinates.flatMap(c => turfPoint(c)));
        // const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        // const value = geometryOps.calculateCentroidTurfVer(points);
        // const centroid = value.geometry.coordinates;

        // log.silly(`Centroid of polygon: ${JSON.stringify(centroid, null, 2)}`);
        // log.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid, null, 2)}`);

        // expect(centroid[0]).to.equal(expectedCentroid[0]);
        // expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });
  });

  describe('calculateLayerIntersections', () => {
    const testFeatureCollection = (featureCollection: FeatureCollection<Point>, coordinates: number[][], layerGeometries: LayerGeometries) => {
      expect(featureCollection).to.be.an('object');
      expect(featureCollection).to.have.property('type');
      expect(featureCollection.type).to.equal('FeatureCollection');
      expect(featureCollection).to.have.property('features');
      expect(featureCollection.features).to.be.an('array');
      expect(featureCollection.features).lengthOf(coordinates.length);
      expect(featureCollection.features[0]).to.be.an('object');
      expect(featureCollection.features[0]).to.have.property('type');
      expect(featureCollection.features[0]).to.have.property('geometry');
      expect(featureCollection.features[0]).to.have.property('properties'); //
      expect(featureCollection.features[0].type).to.equal('Feature');
      expect(featureCollection.features[0].geometry).to.be.an('object');
      expect(featureCollection.features[0].geometry).to.have.property('type');
      expect(featureCollection.features[0].geometry).to.have.property('coordinates');
      expect(featureCollection.features[0].geometry.type).to.equal('Point');
      expect(featureCollection.features[0].geometry.coordinates).to.be.an('array');
      expect(featureCollection.features[0].geometry.coordinates[0]).to.equal(coordinates[0][0]);
      expect(featureCollection.features[0].geometry.coordinates[1]).to.equal(coordinates[0][1]);
      expect(featureCollection.features[0].properties).to.be.an('object');
      const possibleValues = ['testEowData', 'now in eowData field']; // Starts as the first and the code may change to second
      expect(possibleValues).to.include(Object.keys(featureCollection.features[0].properties)[0]);

      return;
    };

    const testFeaturePolygon = (featurePolygon: Feature<Polygon>, coordinates: number[][], layerGeometries: LayerGeometries) => {
      expect(featurePolygon).to.be.an('object');
      expect(featurePolygon).to.have.property('type');
      expect(featurePolygon.type).to.equal('Feature');
      expect(featurePolygon).to.have.property('geometry');
      expect(featurePolygon.geometry.type).to.equal('Polygon');
      expect(featurePolygon.geometry).to.have.property('coordinates');
      expect(featurePolygon.geometry.coordinates).to.be.an('array');
      expect(featurePolygon.geometry.coordinates.length).to.be.greaterThan(0);

      return;
    };

    const buildEOWDataFeatures = (coordinates) => {
      const polygons = [];
      coordinates.forEach(coordinate => {
        polygons.push(turfPolygon([coordinate]));
      });
      return polygons;
    };

    // Test that the given eowPoints are inside the polygon at index of polygons constructed from coords[]
    // Inside will be with some non-null value(s)
    // [
    //   {
    //     "waterBody": {
    //       "polygon": {
    //         "type": "FeatureCollection",
    //         "features": [
    //           {
    //             "type": "Feature",
    //             "properties": {
    //               "now in eowData field": true
    //             },
    //             "geometry": {
    //               "type": "Point",
    //               "coordinates": [
    //                 100,
    //                 100
    //               ]
    //             }
    //           }
    //         ]
    //       },
    //       "name": "TBD"
    //     },
    //     "eowData": {
    //       "testEowData": true
    //     }
    //   },
    //   {
    //     "waterBody": null,
    //     "eowData": null
    //   },
    //   {
    //     "waterBody": null,
    //     "eowData": null
    //   }
    // ]
    const testIsInside = async (theLayerData, theLayerName, eowPoints, index) => {
      const eowDataPoints: FeatureCollection<Point> = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
      // const pointsToTest = turfPoint(eowPoints[0]);

      log.verbose(where, `layerData: ${JSON.stringify(theLayerData, null, 2)}`);
      log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints, null, 2)}`);

      // Test inputs are as expected
      testFeatureCollection(eowDataPoints, eowPoints, theLayerData);

      // Run function under test
      const value = await geometryOps.calculateLayerIntersections(eowDataPoints, theLayerData, theLayerName);
      log.verbose(where, `calculateLayerIntersections: ${JSON.stringify(value, null, 2)}`);

      // Test outputs
      expect(value).to.be.an('array');
      expect(value).lengthOf(layerData.layerFeatures[layerName].length);
      expect(instanceOfEowWaterBodyIntersection(value[index])).to.be.true;  // tslint:disable-line

      testFeaturePolygon(value[index].waterBody.polygon, eowPoints, layerData);
    };

    // Test that the given eowPoints are outside the polygon at index of polygons constructed from coords[]
    // Outside will be with null values:
    // [
    //   {
    //     "waterBody": null,
    //     "eowData": null
    //   },
    //   {
    //     "waterBody": null,
    //     "eowData": null
    //   },
    //   {
    //     "waterBody": null,
    //     "eowData": null
    //   }
    // ]
    const testIsOutside = async (theLayerData, theLayerName, eowPoints, index) => {
      const eowDataPoints: FeatureCollection<Point> = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
      // const pointsToTest = turfPoint(eowPoints[0]);

      log.verbose(where, `layerData: ${JSON.stringify(layerData, null, 2)}`);
      log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints, null, 2)}`);

      // Test inputs are as expected
      testFeatureCollection(eowDataPoints, eowPoints, layerData);

      // Run function under test
      const value = await geometryOps.calculateLayerIntersections(eowDataPoints, theLayerData, theLayerName);
      log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

      // Test outputs
      expect(value).to.be.an('array');
      expect(value).lengthOf(theLayerData.getLayer(theLayerName).length);
      expect(value[index].waterBody).to.not.be.null; // tslint:disable-line
      expect(value[index].eowData).to.be.null; // tslint:disable-line

      testFeaturePolygon(value[index].waterBody.polygon, eowPoints, layerData);
    };

    beforeEach(() => {
      layerData = new LayerGeometries(log);
    });

    describe('one layer, single polygon (square)', () => {
      beforeEach(() => {
        const coordinatesSquare = [[0, 0], [2000, 0], [2000, 2000], [0, 2000], [0, 0]];
        const pointsSquare = turfPolygon([coordinatesSquare]);
        layerName = 'square';
        layerData.layerFeatures[layerName] = [pointsSquare];
      });

      it('single square - test point inside', async () => {
        const eowPoints = [[100, 100]];
        await  testIsInside(layerData, layerName, eowPoints, 0);
      });

      it('single square - test point on vertice (in)', async () => {
        const eowPoints = [[1000, 0]];
        await  testIsInside(layerData, layerName, eowPoints, 0);
      });

      it('single square - test point outside', async () => {
        const eowPoints = [[10000, 10000]];
        await  testIsOutside(layerData, layerName, eowPoints, 0);
      });
    });

    describe('one layer, multiple polygons (squares), disjoint', () => {
      beforeEach(() => {
        // Disjoint squares (no overlap)
        const coords = [];
        coords.push([[0, 0], [2000, 0], [2000, 2000], [0, 2000], [0, 0]]);
        coords.push([[3000, 0], [5000, 0], [5000, 2000], [3000, 2000], [3000, 0]]);
        coords.push([[6000, 0], [8000, 0], [8000, 2000], [6000, 2000], [6000, 0]]);
        const pointsPolygons = buildEOWDataFeatures(coords);
        layerName = 'multiPolygonSquare';
        layerData.layerFeatures[layerName] = [...pointsPolygons];
      });

      it('test point inside 1', async () => {
        const eowPoints = [[100, 100]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside 2', async () => {
        const eowPoints = [[3500, 100]];
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside 3', async () => {
        const eowPoints = [[6500, 100]];
        await testIsInside(layerData, layerName, eowPoints, 2);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
      });

      it('test point on vertice (in) 1', async () => {
        const eowPoints = [[1000, 0]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point on vertice (in) 2', async () => {
        const eowPoints = [[4000, 0]];
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point on vertice (in) 3', async () => {
        const eowPoints = [[7000, 0]];
        await testIsInside(layerData, layerName, eowPoints, 2);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
      });

      it('test point outside 1 to 3', async () => {
        const eowPoints = [[10000, 10000]];
        for (let i = 0; i <= 2; i++) {
          await testIsOutside(layerData, layerName, eowPoints, i);
        }
      });
    });

    describe('one layer, multiple polygons (squares), overlapping', () => {
      beforeEach(() => {
        // overlapping squares
        const coords = [];
        coords.push([[1000, 3000], [3000, 3000], [3000, 5000], [1000, 5000], [1000, 3000]]);
        coords.push([[2000, 4000], [4000, 4000], [4000, 6000], [2000, 6000], [2000, 4000]]);
        coords.push([[1500, 4500], [2500, 4500], [2500, 5500], [1500, 5500], [1500, 4500]]);
        const pointsPolygons = buildEOWDataFeatures(coords);
        layerName = 'multiPolygonSquareOverlap';
        layerData.layerFeatures[layerName] = [...pointsPolygons];
      });

      it('test point inside - 1st only', async () => {
        const eowPoints = [[1750, 3500]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 2nd only', async () => {
        const eowPoints = [[3500, 5250]];
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 3rd only', async () => {
        const eowPoints = [[1750, 5250]];
        await testIsInside(layerData, layerName, eowPoints, 2);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
      });

      it('test point inside - 1st and 2nd only', async () => {
        const eowPoints = [[2250, 4250]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 1st and 3rd only', async () => {
        const eowPoints = [[1750, 4750]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsInside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 2nd and 3rd only', async () => {
        const eowPoints = [[2250, 5250]];
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsInside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - all 3', async () => {
        const eowPoints = [[2250, 4750]];
        for (let i = 0; i <= 2; i++) {
          await testIsInside(layerData, layerName, eowPoints, i);
        }
      });

      it('test point outside all', async () => {
        const eowPoints = [[10000, 10000]];
        for (let i = 0; i <= 2; i++) {
          await testIsOutside(layerData, layerName, eowPoints, i);
        }
      });
    });

    describe('one layer, multiple polygons (squares), overlapping, multiple points', () => {
      beforeEach(() => {
        // overlapping squares
        const coords = [];
        coords.push([[1000, 3000], [3000, 3000], [3000, 5000], [1000, 5000], [1000, 3000]]);
        coords.push([[2000, 4000], [4000, 4000], [4000, 6000], [2000, 6000], [2000, 4000]]);
        coords.push([[1500, 4500], [2500, 4500], [2500, 5500], [1500, 5500], [1500, 4500]]);
        const pointsPolygons = buildEOWDataFeatures(coords);
        layerName = 'multiPolygonSquareOverlapMultiPoints';
        layerData.layerFeatures[layerName] = [...pointsPolygons];
      });

      it('test point inside - 1st only', async () => {
        const eowPoints = [[1750, 3500], [1775, 3525]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 2nd only', async () => {
        const eowPoints = [[3500, 5250], [3525, 5275]];
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 3rd only', async () => {
        const eowPoints = [[1750, 5250], [1775, 5275]];
        await testIsInside(layerData, layerName, eowPoints, 2);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 0);
      });

      it('test point inside - 1st and 2nd only', async () => {
        const eowPoints = [[2250, 4250], [2275, 4275]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsOutside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 1st and 3rd only', async () => {
        const eowPoints = [[1750, 4750], [1775, 4775]];
        await testIsInside(layerData, layerName, eowPoints, 0);
        await testIsOutside(layerData, layerName, eowPoints, 1);
        await testIsInside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - 2nd and 3rd only', async () => {
        const eowPoints = [[2250, 5250], [2275, 5275]];
        await testIsOutside(layerData, layerName, eowPoints, 0);
        await testIsInside(layerData, layerName, eowPoints, 1);
        await testIsInside(layerData, layerName, eowPoints, 2);
      });

      it('test point inside - all 3', async () => {
        const eowPoints = [[2250, 4750], [2275, 4775]];
        for (let i = 0; i <= 2; i++) {
          await testIsInside(layerData, layerName, eowPoints, i);
        }
      });
    });
    // repeat for  layers
    describe('multiple layers, multiple polygons (squares), overlapping, multiple points', () => {
      beforeEach(() => {
        // overlapping squares
        const coords = [];
        coords.push([[1000, 3000], [3000, 3000], [3000, 5000], [1000, 5000], [1000, 3000]]);
        coords.push([[2000, 4000], [4000, 4000], [4000, 6000], [2000, 6000], [2000, 4000]]);
        coords.push([[1500, 4500], [2500, 4500], [2500, 5500], [1500, 5500], [1500, 4500]]);
        const pointsPolygons = buildEOWDataFeatures(coords);
        layerName = 'multiPolygonSquareOverlapMultiPoints';
        layerData.layerFeatures[layerName] = [...pointsPolygons];

        const coords2 = [];
        coords2.push([[0, 0], [2000, 0], [2000, 2000], [0, 2000], [0, 0]]);
        coords2.push([[3000, 0], [5000, 0], [5000, 2000], [3000, 2000], [3000, 0]]);
        coords2.push([[6000, 0], [8000, 0], [8000, 2000], [6000, 2000], [6000, 0]]);
        const pointsPolygons2 = buildEOWDataFeatures(coords2);
        layerName2 = 'multiPolygonSquare';
        layerData.layerFeatures[layerName2] = [...pointsPolygons2];
      });

      describe('coords 1 (multi overlapping)', () => {
        it('test point inside - 1st only', async () => {
          const eowPoints = [[1750, 3500], [1775, 3525]];
          await testIsInside(layerData, layerName, eowPoints, 0);
          await testIsOutside(layerData, layerName, eowPoints, 1);
          await testIsOutside(layerData, layerName, eowPoints, 2);
        });

        it('test point inside - 2nd only', async () => {
          const eowPoints = [[3500, 5250], [3525, 5275]];
          await testIsInside(layerData, layerName, eowPoints, 1);
          await testIsOutside(layerData, layerName, eowPoints, 0);
          await testIsOutside(layerData, layerName, eowPoints, 2);
        });

        it('test point inside - 3rd only', async () => {
          const eowPoints = [[1750, 5250], [1775, 5275]];
          await testIsInside(layerData, layerName, eowPoints, 2);
          await testIsOutside(layerData, layerName, eowPoints, 1);
          await testIsOutside(layerData, layerName, eowPoints, 0);
        });

        it('test point inside - 1st and 2nd only', async () => {
          const eowPoints = [[2250, 4250], [2275, 4275]];
          await testIsInside(layerData, layerName, eowPoints, 0);
          await testIsInside(layerData, layerName, eowPoints, 1);
          await testIsOutside(layerData, layerName, eowPoints, 2);
        });

        it('test point inside - 1st and 3rd only', async () => {
          const eowPoints = [[1750, 4750], [1775, 4775]];
          await testIsInside(layerData, layerName, eowPoints, 0);
          await testIsOutside(layerData, layerName, eowPoints, 1);
          await testIsInside(layerData, layerName, eowPoints, 2);
        });

        it('test point inside - 2nd and 3rd only', async () => {
          const eowPoints = [[2250, 5250], [2275, 5275]];
          await testIsOutside(layerData, layerName, eowPoints, 0);
          await testIsInside(layerData, layerName, eowPoints, 1);
          await testIsInside(layerData, layerName, eowPoints, 2);
        });

        it('test point inside - all 3', async () => {
          const eowPoints = [[2250, 4750], [2275, 4775]];
          for (let i = 0; i <= 2; i++) {
            await testIsInside(layerData, layerName, eowPoints, i);
          }
        });

      });
      describe('coords 2 (square)', () => {
        it('test point inside 1', async () => {
          const eowPoints = [[100, 100]];
          await testIsInside(layerData, layerName2, eowPoints, 0);
          await testIsOutside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 2);
        });

        it('test point inside 2', async () => {
          const eowPoints = [[3500, 100]];
          await testIsInside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 0);
          await testIsOutside(layerData, layerName2, eowPoints, 2);
        });

        it('test point inside 3', async () => {
          const eowPoints = [[6500, 100]];
          await testIsInside(layerData, layerName2, eowPoints, 2);
          await testIsOutside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 0);
        });

        it('test point on vertice (in) 1', async () => {
          const eowPoints = [[1000, 0]];
          await testIsInside(layerData, layerName2, eowPoints, 0);
          await testIsOutside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 2);
        });

        it('test point on vertice (in) 2', async () => {
          const eowPoints = [[4000, 0]];
          await testIsInside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 0);
          await testIsOutside(layerData, layerName2, eowPoints, 2);
        });

        it('test point on vertice (in) 3', async () => {
          const eowPoints = [[7000, 0]];
          await testIsInside(layerData, layerName2, eowPoints, 2);
          await testIsOutside(layerData, layerName2, eowPoints, 1);
          await testIsOutside(layerData, layerName2, eowPoints, 0);
        });

        it('test point outside 1 to 3', async () => {
          const eowPoints = [[10000, 10000]];
          for (let i = 0; i <= 2; i++) {
            await testIsOutside(layerData, layerName2, eowPoints, i);
          }
        });
      });
    });
  });
});
