import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';

/* global BMap, BMAP_STATUS_SUCCESS */
class BDMap extends React.Component {
    constructor(props) {
        super(props);
    }

    addMarker(point) {
        var icon = new BMap.Icon('images/marker.png', new BMap.Size(10, 10));
        var marker = new BMap.Marker(point, {
            icon: icon
        });
        this._map.addOverlay(marker);
        if (this._lastPoint) {
            this.drawLine(this._lastPoint, point);
        }
        this._lastPoint = point;
        this.props.onPointAdd(new Point(point.lng, point.lat));
    }

    drawLine(point1, point2) {
        var polyline = new BMap.Polyline([
            point1, point2
        ], {
            strokeColor: 'blue',
            strokeWeight: 6,
            strokeOpacity: 0.5
        });
        this._map.addOverlay(polyline);
    }

    componentDidMount() {
        this._map = new BMap.Map('map');
        var point = new BMap.Point(116.404, 39.915); // 创建点坐标
        this._map.centerAndZoom(point, 15); // 初始化地图，设置中心点坐标和地图级别
        this._map.addControl(new BMap.NavigationControl());
        this._map.addControl(new BMap.ScaleControl());
        this._map.addControl(new BMap.OverviewMapControl());
        this._map.addControl(new BMap.MapTypeControl());
        this._map.setCurrentCity('北京'); // 仅当设置城市信息时，MapTypeControl的切换功能才能可用

        var marker = new BMap.Marker(point);
        this._map.addOverlay(marker);
        marker.enableDragging();
        marker.addEventListener('dragend', function(e) {
            this.addMarker(e.point);
        }.bind(this));

        var opts = {
            width : 250,     // 信息窗口宽度
            height: 100,     // 信息窗口高度
            title : '提示'  // 信息窗口标题
        };
        var infoWindow = new BMap.InfoWindow('拖动标记以记录移动路径', opts);  // 创建信息窗口对象
        this._map.openInfoWindow(infoWindow, point);      // 打开信息窗口

        var options = {
            renderOptions: {
                map: this._map,
                autoViewport: true
            },
            pageCapacity: 8,
            onSearchComplete: function(results) {
                if (this._local.getStatus() == BMAP_STATUS_SUCCESS) {
                    if (results.getCurrentNumPois() > 0) {
                        var firstPoi = results.getPoi(0).point;
                        // make a little bit offset.
                        var markerAnchor = new BMap.Point(firstPoi.lng + 0.0001, firstPoi.lat);
                        marker.setPosition(markerAnchor);
                    }
                }
            }.bind(this)
        };

        this._local = new BMap.LocalSearch(this._map, options);

    }

    render() {
        return (
            <div id = 'map'/>
        );
    }
}

BDMap.propTypes = {
    localSearchText: React.PropTypes.string,
    onPointAdd: React.PropTypes.func
};

class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleButtonClick() {
        this.props.onUserInput(
            this.refs.searchInput.value
        );
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.handleButtonClick();
        }
    }

    render() {
        return (
            <div id='search-bar'>
                <input
                    type='text'
                    placeholder='请输入地点名称'
                    ref='searchInput'
                    onKeyPress={this.handleKeyPress}
                />
                <input type='button' value='确定' onClick={this.handleButtonClick} />
            </div>
        );
    }
}

SearchBar.propTypes = {
    onUserInput:  React.PropTypes.func
};

class Point {
    constructor(lng, lat) {
        this.lng = lng;
        this.lat = lat;
    }
}

class GeoTable extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var rows = [];
        this.props.coords.forEach((point) => {
            rows.push(
                <tr>
                    <td>{point.lng}</td>
                    <td>{point.lat}</td>
                </tr>
            );
        });
        return (
            <table id='coords-table'>
                <thead>
                    <tr>
                        <th>Longitude</th>
                        <th>Latitude</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }
}

GeoTable.propTypes = {
    coords: React.PropTypes.array
};

class Root extends React.Component {
    constructor(props) {
        super(props);

        this.handleUserInput = this.handleUserInput.bind(this);
        this.handleAddPoint = this.handleAddPoint.bind(this);
        this.state = {
            coords: []
        };
    }

    handleUserInput(searchText) {
        this.refs.bdmap._local.search(searchText);
    }

    handleAddPoint(point) {
        this.setState({
            coords: this.state.coords.concat([point])
        });
    }

    render() {
        return (
            <div >
                <h1>Coordinates Picker</h1>
                <SearchBar onUserInput={this.handleUserInput}/>
                <BDMap ref='bdmap' onPointAdd={this.handleAddPoint}/>
                <GeoTable coords={this.state.coords} />
            </div>
        );
    }
}


ReactDOM.render(
    <Root />,
    document.getElementById('root')
);
