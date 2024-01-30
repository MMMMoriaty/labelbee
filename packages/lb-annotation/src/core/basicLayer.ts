/**
 * @author wanghaiqing wanghaiqing@sensetime.com
 * @date 1/30/24
 */

import { EToolName, THybridToolName } from '@/constant/tool';
import CanvasUtils from '@/utils/tool/CanvasUtils';
import DrawUtils from '@/utils/tool/DrawUtils';
import AxisUtils, { CoordinateUtils } from '@/utils/tool/AxisUtils';
import { HybridToolUtils } from '@/core/scheduler';
import { ICommonProps } from './index'

interface IBasicLayerProps extends ICommonProps {
  container: HTMLElement;
  size: ISize;
  toolName: THybridToolName;
  imgNode?: HTMLImageElement; // 展示图片的内容
  config?: string; // 任务配置
  style?: any;
  forbidBasicResultRender?: boolean;
}

export default class BasicLayer {
  public container: HTMLElement; // 当前结构绑定 container
  public size: ISize;

  public imgNode?: HTMLImageElement;

  public basicCanvas!: HTMLCanvasElement;  // dom for basic layer

  public basicResult?: any; // data of depended tool

  public dependToolName?: EToolName;

  public forbidBasicResultRender: boolean; // 禁止渲染基础依赖图形

  public zoom: number;

  public currentPos: ICoordinate; // 存储实时偏移的位置

  public basicImgInfo: any; // 用于存储当前图片的信息

  public coordUtils?: CoordinateUtils;

  private hiddenImg: boolean;

  private _imgAttribute?: any;

  constructor(props: IBasicLayerProps) {
    this.container = props.container;
    this.size = props.size;
    this.zoom = props.zoom ?? 1;
    this.currentPos = props.currentPos ?? { x: 0, y: 0};
    this.basicImgInfo = props.basicImgInfo;
    this.coordUtils = props.coordUtils;
    this._imgAttribute = props.imgAttribute ?? {};

    this.imgNode = props.imgNode;
    this.hiddenImg = !HybridToolUtils.isSingleTool(props.toolName) || false;
    this.forbidBasicResultRender = props.forbidBasicResultRender ?? false;

    this.createBasicCanvas(props.size)
  }

  // getters
  get basicCtx() {
    return this.basicCanvas?.getContext('2d');
  }

  public get pixelRatio() {
    return CanvasUtils.getPixelRatio(this.basicCanvas?.getContext('2d'));
  }

  get rotate() {
    return this.basicImgInfo?.rotate ?? 0;
  }

  // setters
  public setZoom(zoom: number) {
    this.zoom = zoom;
  }

  public setCurrentPos(currentPos: ICoordinate) {
    this.currentPos = currentPos;
  }

  public setBasicImgInfo(basicImgInfo: any) {
    this.basicImgInfo = basicImgInfo;
  }

  public setImgAttribute(imgAttribute: IImageAttribute) {
    this._imgAttribute = imgAttribute;
    this.renderBasicCanvas()
  }

  /**
   * 更改当前 canvas 整体的大小，需要重新初始化
   * @param size
   */
  public setSize(size: ISize) {
    this.size = size;
    console.log(size)
    if (this.container.contains(this.basicCanvas)) {
      this.destroyBasicCanvas();
      this.createBasicCanvas(size);
      this.renderBasicCanvas()
    }
  }

  public createBasicCanvas(size: ISize) {
    const basicCanvas = document.createElement('canvas');
    basicCanvas.className = 'bee-basic-layer'
    this.updateCanvasBasicStyle(basicCanvas, size, 0);
    this.basicCanvas = basicCanvas
    if (this.container.hasChildNodes()) {
      this.container.insertBefore(basicCanvas, this.container.childNodes[0]);
    } else {
      this.container.appendChild(basicCanvas)
    }
    this.basicCtx?.scale(this.pixelRatio, this.pixelRatio)
  }

  public updateCanvasBasicStyle(canvas: HTMLCanvasElement, size: ISize, zIndex: number) {
    const pixel = this.pixelRatio;
    canvas.style.position = 'absolute';
    canvas.width = size.width * pixel;
    canvas.height = size.height * pixel;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = `${zIndex} `;
  }

  public drawImg = () => {
    if (!this.imgNode || this.hiddenImg === true) return;

    console.log('drawimg')
    console.log(this.zoom)

    DrawUtils.drawImg(this.basicCanvas, this.imgNode, {
      zoom: this.zoom,
      currentPos: this.currentPos,
      rotate: this.rotate,
      imgAttribute: this._imgAttribute,
    });
  };

  public destroyBasicCanvas() {
    if (this.basicCanvas && this.container.contains(this.basicCanvas)) {
      this.container.removeChild(this.basicCanvas);
    }
  }
  public clearBasicCanvas() {
    this.basicCtx?.clearRect(0, 0, this.size.width, this.size.height);
  }

  public renderBasicCanvas() {
    if (!this.basicCanvas) {
      return;
    }

    this.clearBasicCanvas();
    this.drawImg();

    const thickness = 3;

    if (this.forbidBasicResultRender) {
      return;
    }

    if (this.basicResult && this.dependToolName) {
      switch (this.dependToolName) {
        case EToolName.Rect: {
          DrawUtils.drawRect(
            this.basicCanvas,
            AxisUtils.changeRectByZoom(this.basicResult, this.zoom, this.currentPos),
            {
              color: 'rgba(204,204,204,1.00)',
              thickness,
            },
          );
          break;
        }

        case EToolName.Polygon: {
          DrawUtils.drawPolygonWithFillAndLine(
            this.basicCanvas,
            AxisUtils.changePointListByZoom(this.basicResult.pointList, this.zoom, this.currentPos),
            {
              fillColor: 'transparent',
              strokeColor: 'rgba(204,204,204,1.00)',
              isClose: true,
              thickness,
            },
          );

          break;
        }

        case EToolName.Line: {
          DrawUtils.drawLineWithPointList(
            this.basicCanvas,
            AxisUtils.changePointListByZoom(this.basicResult.pointList, this.zoom, this.currentPos),
            {
              color: 'rgba(204,204,204,1.00)',
              thickness,
            },
          );

          break;
        }

        default: {
          //
        }
      }
    }
  }

}