import {ApplicationLayers} from './layers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import Brolog from 'brolog';
import Map from 'ol/Map';
import {EOWMap} from './eow-map';
import {of} from 'rxjs';
import VectorLayer from 'ol/layer/Vector';
import BaseLayer from 'ol/layer/Base';
import Group from 'ol/layer/Group';

const expect = chai.expect;
chai.use(chaiAsPromised);

let log: Brolog;

const where = 'Layers.spec';

describe('Layers', () => {
  let layers: ApplicationLayers;
  const baseLayerName = 'Test_layerOrFeatureName';
  const baseGroup = 'Test_group';

  beforeEach(() => {
    log = new Brolog();
    log.level('verbose');

    const mapLayers: BaseLayer[] = [];

    const mockMap = new Map({});
    sinon.stub(mockMap, 'getLayers').callsFake(() => {
      return {
        getLength: () => {
          return mapLayers.length;
        },
        getArray: () => (mapLayers)
      };
    });
    sinon.stub(mockMap, 'addLayer').callsFake((layer: BaseLayer) => {
      mapLayers.push(layer);
    });
    const mockEOWMap = new EOWMap(log);
    const mockEOWMapStub = sinon.stub(mockEOWMap, 'getMap').callsFake(() => {
      return of(mockMap);
    });
    layers = new ApplicationLayers(mockEOWMap, log);
  });

  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });

  describe(`creating`, () => {
    it(`new layer should set list size to 1`, () => {
      layers.createLayer({layerOrFeatureName: baseLayerName + '1'}, () => (new VectorLayer()));
      // .then(value => console.log(`promise value: ${value}`));

      expect(layers.getMapLayers().getLength()).to.eq(1);
    });

    it(`2nd new layer should set list size to 2`, () => {
      layers.createLayer({layerOrFeatureName: baseLayerName + '1'}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2'}, () => (new VectorLayer()));

      expect(layers.getMapLayers().getLength()).to.eq(2);
    });

    it(`2 layers should be able to lookup by name`, () => {
      layers.createLayer({layerOrFeatureName: baseLayerName + '1'}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2'}, () => (new VectorLayer()));
      const getLayer1 = layers.getLayer(baseLayerName + '1');
      expect(getLayer1).to.not.be.null; // tslint:disable-line
      expect(getLayer1).to.not.be.undefined; // tslint:disable-line
      expect(getLayer1.get('layerName')).to.not.be.null;  // tslint:disable-line
      expect(getLayer1.get('layerName')).to.eql(baseLayerName + '1');
      const getLayer2 = layers.getLayer(baseLayerName + '2');
      expect(getLayer2).to.not.be.undefined; // tslint:disable-line
      expect(getLayer2).to.not.be.null; // tslint:disable-line
      expect(getLayer2.get('layerName')).to.not.be.null;  // tslint:disable-line
      expect(getLayer2.get('layerName')).to.eql(baseLayerName + '2');
    });

    it(`2 layers should NOT be able to have same name`, () => {
      const create = () => layers.createLayer({layerOrFeatureName: baseLayerName}, () => (new VectorLayer()));
      create(); // succeeds
      return expect(create()).to.be.rejectedWith(`Cannot create layer with same name "${baseLayerName}`);
    });

    it(`2 layers should NOT be able to have same name unless options.allowMergeThruSameLayerName = true`, () => {
      const create = () => layers.createLayer({
        layerOrFeatureName: baseLayerName,
        allowMergeThruSameLayerName: true
      }, () => (new VectorLayer()));
      create(); // succeeds
      return expect(create()).to.be.eventually.fulfilled; // rejectedWith(`Cannot create layer with same name "${baseLayerName}`);
    });

    it(`A group with the GroupName should be created if a new layer refers to it`, () => {
      const create = () => layers.createLayer({layerOrFeatureName: baseLayerName, layerGroupName: baseGroup},
        () => (new VectorLayer()));
      return create().then((layer) => {
        expect(layer).to.not.be.null;       // tslint:disable-line
        expect(layer).to.not.be.undefined;  // tslint:disable-line
        console.log(`layer keys: ${Object.keys(layer)}`);
        expect(layers.getMapLayers().getArray()).lengthOf(1);
        expect(layers.getGroup(baseGroup).constructor.name).to.eql(`LayerGroup`);
        expect(layers.getGroup(baseGroup).get('groupName')).to.eql(baseGroup);
        expect(layers.getGroup(baseGroup).getLayersArray()).lengthOf(1);
      });
    });

    const expectedLayerTypes = ['ImageLayer', 'TileLayer', 'VectorLayer'];

    it(`a layer should be of type Layer - no group layer`, () => {
      // TODO
      const create = () => layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: baseGroup},
        () => (new VectorLayer()));
      return create().then((layer: BaseLayer) => {
        expect(expectedLayerTypes).to.contain(layer.constructor.name);
      });
    });

    it(`a layer should be of type Layer - even if a group layer`, () => {
      // TODO
      const create = () => layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: baseGroup},
        () => (new VectorLayer()));
      return create().then((layer: BaseLayer) => {
        expect(expectedLayerTypes).to.contain(layer.constructor.name);
      });
    });

    it(`2 layers added to group - should be able to see groupname property`, () => {
      const groupName1 = baseGroup + '1';
      const groupName2 = baseGroup + '2';
      layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: groupName1}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: groupName2}, () => (new VectorLayer()));
      const getLayer1 = layers.getGroup(groupName1);
      expect(getLayer1).to.not.be.undefined; // tslint:disable-line
      expect(getLayer1).to.not.be.null; // tslint:disable-line
      expect(getLayer1.get('groupName')).to.not.be.null;  // tslint:disable-line
      expect(getLayer1.get('groupName')).to.eql(groupName1);
      const getLayer2 = layers.getGroup(groupName2);
      expect(getLayer2).to.not.be.undefined; // tslint:disable-line
      expect(getLayer2).to.not.be.null; // tslint:disable-line
      expect(getLayer2.get('groupName')).to.not.be.null;  // tslint:disable-line
      expect(getLayer2.get('groupName')).to.eql(groupName2);
    });

    it(`2 layers added to group - should have 2 layers`, () => {
      layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: baseGroup}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: baseGroup}, () => (new VectorLayer()));
      const allLayers = layers.getAllLayers(layers.getMapLayers().getArray());
      expect(allLayers).lengthOf(2);
    });

    it(`2 layers added to group + one outside of group - should have 3 layers`, () => {
      layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: baseGroup}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: baseGroup}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '3'}, () => (new VectorLayer()));
      const allLayers = layers.getAllLayers(layers.getMapLayers().getArray());
      expect(allLayers).lengthOf(3);
    });

    it(`2 layers added to 2 groups group + one outside of group - should have 5 layers`, () => {
      const groupName1 = baseGroup + '1';
      const groupName2 = baseGroup + '2';
      layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: groupName1}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: groupName1}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '3', layerGroupName: groupName2}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '4', layerGroupName: groupName2}, () => (new VectorLayer()));
      layers.createLayer({layerOrFeatureName: baseLayerName + '5'}, () => (new VectorLayer()));
      const allLayers = layers.getAllLayers(layers.getMapLayers().getArray());
      expect(allLayers).lengthOf(5);
    });
  });

  it(`2 layers added to 2 groups group + one outside of group - should have 5 layers - and use dupe layerNames across groups`, () => {
    const groupName1 = baseGroup + '1';
    const groupName2 = baseGroup + '2';
    layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: groupName1}, () => (new VectorLayer()));
    layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: groupName1}, () => (new VectorLayer()));
    layers.createLayer({layerOrFeatureName: baseLayerName + '1', layerGroupName: groupName2}, () => (new VectorLayer()));
    layers.createLayer({layerOrFeatureName: baseLayerName + '2', layerGroupName: groupName2}, () => (new VectorLayer()));
    layers.createLayer({layerOrFeatureName: baseLayerName + '5'}, () => (new VectorLayer()));
    const allLayers = layers.getAllLayers(layers.getMapLayers().getArray());
    expect(allLayers).lengthOf(5);
  });
});
