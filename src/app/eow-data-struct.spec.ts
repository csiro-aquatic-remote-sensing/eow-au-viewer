import {EowDataStruct} from './eow-data-struct';
import * as chai from 'chai';
import moment from 'moment-timezone';

const expect = chai.expect;

moment.tz.add('Etc/UTC|UTC|0|0||');

const getZDateFormated = (d) => {
  return moment(d).format('MM/DD/YYYY hh:mm Z');
};

describe(`prepareTimeSeriesChartData`, () => {
  describe(`2 dates`, () => {
    it(`2 different dates, different fu, already sorted by date`, () => {
      const a = {values_: {date_photo: '2020-02-22T01:00:00Z', fu_value: 12}};
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const features = [a, b];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(a.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`2 different dates, different fu, not sorted by date`, () => {
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const a = {values_: {date_photo: '2020-02-22T01:00:00Z', fu_value: 12}};
      const features = [a, b];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(a.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`2 dates same, different fu, sorted by fu`, () => {
      const a = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 12}};
      const features = [a, b];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(a.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(b.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`2 dates same, different fu, not sorted by fu`, () => {
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const a = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 12}};
      const features = [a, b];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(a.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });
  });
  describe(`3 dates`, () => {
    it(`3 different dates, different fu, already sorted by date`, () => {
      const a = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const b = {values_: {date_photo: '2020-02-22T01:00:00Z', fu_value: 12}};
      const c = {values_: {date_photo: '2020-02-23T01:00:00Z', fu_value: 14}};
      const features = [a, b, c];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(a.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[2].date).to.equal(c.values_.date_photo);
      expect(timeSeriesData[2].fu).to.equal(c.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`3 different dates, different fu, not sorted by date`, () => {
      const c = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const b = {values_: {date_photo: '2020-02-22T01:00:00Z', fu_value: 12}};
      const a = {values_: {date_photo: '2020-02-23T01:00:00Z', fu_value: 14}};
      const features = [a, b, c];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(c.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(c.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[2].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[2].fu).to.equal(a.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`3 dates same, different fu, sorted by fu`, () => {
      const a = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 12}};
      const c = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 14}};
      const features = [a, b, c];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(a.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[2].date).to.equal(c.values_.date_photo);
      expect(timeSeriesData[2].fu).to.equal(c.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });

    it(`3 dates same, different fu, not sorted by fu`, () => {
      const c = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 10}};
      const b = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 12}};
      const a = {values_: {date_photo: '2020-02-21T01:00:00Z', fu_value: 14}};
      const features = [a, b, c];
      const timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(features);

      expect(timeSeriesData[0].date).to.equal(c.values_.date_photo);
      expect(timeSeriesData[0].fu).to.equal(c.values_.fu_value);
      expect(timeSeriesData[1].date).to.equal(b.values_.date_photo);
      expect(timeSeriesData[1].fu).to.equal(b.values_.fu_value);
      expect(timeSeriesData[2].date).to.equal(a.values_.date_photo);
      expect(timeSeriesData[2].fu).to.equal(a.values_.fu_value);
      timeSeriesData.forEach((t, i) => expect(t.index).to.equal(i));
    });
  });

});
