import Lottie from "react-lottie-player";

type IconProps = {
  isPlaying: boolean;
  index: number;
  json: object;
};

const Icon: React.FC<IconProps> = ({ isPlaying, index, json }) => {
  return (
    <Lottie
      key={index}
      animationData={json}
      play={isPlaying}
      loop={false}
      style={{ width: 20, height: 20, fill: "white" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
    />
  );
};

export default Icon;
